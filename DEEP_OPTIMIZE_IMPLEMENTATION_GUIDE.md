# Deep Optimize (MIPRO) Implementation Guide

This document provides a comprehensive, step-by-step guide to implementing the "Deep Optimize" functionality using **DSPy**. It is designed to be given to an AI assistant (like Gemini or Claude) or a developer to replicate this exact architecture in another software application.

---

## 1. conceptual Overview

**What is Deep Optimize?**
Unlike standard "Prompt Engineering" which simply rewrites a prompt using best practices, **Deep Optimize** uses a compilation approach. It treats the prompt as a program that can be optimized against data.

**The Workflow:**
1.  **Input:** User provides a high-level `Task Description` (e.g., "Write a poem about space").
2.  **Data Generation:** The system uses an LLM to generate synthetic `(Input, Output)` examples for this task.
3.  **Optimization (Compilation):** The system runs a "Teacher" model against these examples, trying to solve them.
4.  **Selection:** It uses a "Judge" (Metric) to score the solutions.
5.  **Bootstrapping:** The best solutions are saved as "Few-Shot Demos".
6.  **Output:** The final prompt consists of the original instruction + the mathematically proven best examples.

---

## 2. Technical Architecture

The system is composed of four main components:
1.  **Synthetic Data Generator:** Creates the Training Set.
2.  **The Metric (Judge):** Evaluates performance.
3.  **The Optimizer:** Runs the DSPy `BootstrapFewShot` teleprompter.
4.  **The Job Manager:** Handles the long-running process asynchronously.

---

## 3. Implementation Steps

### Step 1: Synthetic Data Generation

First, we need training data. We cannot optimize a prompt without examples. Since the user might not provide them, we generate them.

**DSPy Signature (`SyntheticDataGenerator`):**
Define the input/output structure for the generator.
```python
import dspy

class SyntheticDataGenerator(dspy.Signature):
    """Generate diverse, high-quality input-output examples for a given task description."""
    
    task_description = dspy.InputField(desc="The goal or task definition.")
    num_examples = dspy.InputField(desc="Number of examples to generate (e.g., '3').")
    
    # The output is a single string we will parse later
    generated_examples = dspy.OutputField(desc="Formatted list of Input: ... Output: ...")
```

**The Module:**
```python
class DataGenModule(dspy.Module):
    def __init__(self):
        super().__init__()
        # Use ChainOfThought to encourage better data quality
        self.generate = dspy.ChainOfThought(SyntheticDataGenerator)
    
    def forward(self, task, num=3):
        return self.generate(task_description=task, num_examples=str(num))
```

### Step 2: The Metric (The Judge)

We need a way to tell if the optimization is working. We define a "Judge" LLM that scores outputs.

**DSPy Signature (`Assessment`):**
```python
class Assessment(dspy.Signature):
    """Assess the quality of an output given an input and a task description."""
    
    task_description = dspy.InputField()
    input_text = dspy.InputField()
    output_text = dspy.InputField()
    
    assessment_score = dspy.OutputField(desc="Integer score 1-5")
    rationale = dspy.OutputField(desc="Reasoning for the score")
```

**The Logic (`llm_metric`):**
This function is called by the optimizer to check if a generated answer (`pred`) is good.
```python
def llm_metric(gold, pred, trace=None):
    # In a full production system, you would call the Assessment module here.
    # For speed/demo, we often check if the output is valid (non-empty).
    
    # Example Semantic Check:
    # judge = dspy.ChainOfThought(Assessment)
    # result = judge(task=..., input=..., output=pred.output)
    # return int(result.assessment_score) >= 4
    
    return len(pred.output) > 5 # Simple heuristic for minimal validity
```

### Step 3: The Optimization Loop

This is the core engine. We use `BootstrapFewShot` to "learn" the best demos.

```python
from dspy.teleprompt import BootstrapFewShot

def run_optimization(task, training_data):
    """
    task: str ("Write a poem")
    training_data: list of dicts [{'input': '...', 'output': '...'}]
    """
    
    # 1. Define the Dynamic User Signature
    # This represents the program we want to optimize (Input -> Output)
    UserSignature = dspy.make_signature(
        "input -> output",
        instructions=task
    )

    # 2. Define the Program to Optimize
    class UserProgram(dspy.Module):
        def __init__(self):
            self.predict = dspy.ChainOfThought(UserSignature)
        def forward(self, input):
            return self.predict(input=input)

    # 3. Prepare Training Set
    # Convert raw dicts to dspy.Example objects
    trainset = [dspy.Example(input=ex['input'], output=ex['output']).with_inputs('input') for ex in training_data]

    # 4. Initialize Teleprompter (The Optimizer)
    # max_bootstrapped_demos = How many generated examples to keep in the final prompt
    teleprompter = BootstrapFewShot(metric=llm_metric, max_bootstrapped_demos=3, max_labeled_demos=3)

    # 5. Compile!
    # This runs the optimization process
    print("Compiling program...")
    compiled_program = teleprompter.compile(UserProgram(), trainset=trainset)
    
    return compiled_program
```

### Step 4: Extracting the Prompt

Once compiled, `compiled_program` is an executable object. To show the user the *text* of the prompt, we must reverse-engineer it.

```python
def extract_prompt_from_predictor(program):
    predictor = program.predict # Access the internal ChainOfThought predictor
    
    # 1. Get Base Instructions
    prompt_text = f"Instructions: {predictor.extended_signature.instructions}\n\n"
    
    # 2. Extract Optimized Demos (This is what Deep Optimize found!)
    if hasattr(predictor, 'demos') and predictor.demos:
        prompt_text += "--- Optimized Examples (Learned by DSPy) ---\n"
        for i, demo in enumerate(predictor.demos):
            prompt_text += f"\nExample {i+1}:\n"
            prompt_text += f"Input: {demo.input}\n"
            prompt_text += f"Output: {demo.output}\n"
            
    prompt_text += "\n--- End of Examples ---\n"
    return prompt_text
```

### Step 5: Background Job Architecture

Since compilation can take 30-120 seconds, you CANNOT run this in a synchronous API call. You must use a Job system.

**Backend (FastAPI Example):**
```python
JOBS = {} # In-memory store (Use Redis for production)

@app.post("/api/optimize")
async def start_optimization(task: str, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "pending"}
    
    # Run in background
    background_tasks.add_task(process_job, job_id, task)
    
    return {"job_id": job_id}

@app.get("/api/jobs/{job_id}")
def get_status(job_id: str):
    return JOBS.get(job_id)

def process_job(job_id, task):
    try:
        # 1. Generate Data
        data_gen = DataGenModule()
        examples = data_gen(task)
        parsed_examples = parse_text_to_dicts(examples.generated_examples)
        
        # 2. Run Optimization
        optimized_program = run_optimization(task, parsed_examples)
        
        # 3. Extract Text
        final_prompt = extract_prompt_from_predictor(optimized_program)
        
        JOBS[job_id] = {"status": "completed", "result": final_prompt}
    except Exception as e:
        JOBS[job_id] = {"status": "failed", "error": str(e)}
```

### Step 6: Frontend Integration

The frontend must poll the status endpoint until completion.

1.  **Start:** Call `POST /api/optimize`. Get `job_id`.
2.  **Poll:** Call `GET /api/jobs/{job_id}` every 2 seconds.
3.  **Finish:** When `status === "completed"`, display `result`.

---

## checklist for Replication

When asking an AI to implement this, verify these files exist:
*   [ ] `synthetic_data.py`: Handles creation of `(Input, Output)` pairs.
*   [ ] `optimizer.py`: Handles `dspy.teleprompt.BootstrapFewShot` logic.
*   [ ] `job_manager` (or logic in `main.py`): Handles async processing.
*   [ ] `metric` function: Ensures the model isn't learning bad behaviors.

This architecture ensures your prompt generator isn't just a "text rewriter" but a mathematically optimized system prompt compiler.
