# Code Refactoring Plan: Human-Readable Naming

## Objective
Rename all function names, variables, and class names to simple English for improved code readability.

## Naming Conventions

### General Rules
- Use full English words instead of abbreviations
- Use descriptive names that explain purpose
- Follow camelCase for variables and functions
- Follow PascalCase for components and types
- Use verb-noun combinations for functions (e.g., `handleClick`, `getUserData`)

## File-by-File Changes

### 1. PromptLabNew.tsx

#### Component Name
- `PromptLabNew` → `PromptLaboratory` (more descriptive)

#### State Variables
- `isTemplateDrawerOpen` → `isTemplateDrawerVisible`
- `isSaveModalOpen` → `isSaveModalVisible`
- `isConfigModalOpen` → `isConfigurationModalVisible`
- `activeConfigTab` → `selectedConfigurationTab`
- `isOutputModalOpen` → `isOutputModalVisible`
- `isComplexityModalOpen` → `isComplexitySelectionVisible`

#### Functions
- `handleExport` → `exportPromptToFile`
- `handleSaveNew` → `saveNewPrompt`
- `handleUpdate` → `updateExistingPrompt`
- `handleSaveWithTitle` → `savePromptWithTitle`

#### Computed Values
- `isFormValid` → `areAllRequiredFieldsFilled`
- `tokenBreakdownItems` → `tokenUsageBreakdownDisplay`
- `currentFramework` → `selectedFramework`

### 2. QualityScore.tsx

#### Functions
- `getScoreColor` → `getColorForScore`
- `getBarColor` → `getProgressBarColor`
- `handleMouseEnter` → `showTooltipOnHover`
- `valToColor` → `convertValueToColor`

#### Variables
- `val` → `scoreValue`

### 3. PromptOutput.tsx

#### State Variables
- `loadingStep` → `currentLoadingStep`
- `isVisualMode` → `isVisualModeEnabled`

#### Functions
- `handleReplace` → `replaceTextInPrompt`

#### Variables
- `textSteps` → `loadingStepMessages`

### 4. SimpleIdea.tsx

#### Functions
- `handleSuggestion` → `generateIdeaSuggestion`
- `applySuggestion` → `applyGeneratedSuggestion`
- `handleTemplateSelect` → `selectPromptTemplate`
- `handleFileUpload` → `uploadAttachmentFile`
- `handleKeyDown` → `handleKeyboardShortcut`
- `getIconForType` → `getIconForFileType`

### 5. ReversePromptPage.tsx

#### Functions
- `startTutorial` → `beginInteractiveTutorial`
- `nextTutorialStep` → `advanceToNextTutorialStep`
- `endTutorial` → `closeTutorial`
- `handleFileUpload` → `uploadReferenceFile`
- `handleRemoveFile` → `removeUploadedFile`
- `handleEnhanceInput` → `enhanceUserInput`
- `handleAnalyze` → `analyzePromptStructure`

#### Types
- `UploadedFile` → `AttachedFile`

## Implementation Order

1. Start with utility functions and types
2. Move to component state variables
3. Update function names
4. Update all references throughout the codebase
5. Test to ensure no breaking changes

## Benefits

- **Improved Readability**: Code is self-documenting
- **Easier Onboarding**: New developers can understand code faster
- **Better Maintenance**: Clear naming reduces bugs
- **Enhanced Collaboration**: Team members understand intent immediately
