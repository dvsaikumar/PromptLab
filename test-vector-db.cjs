
const lancedb = require('@lancedb/lancedb');
const path = require('path');
const fs = require('fs');

async function testVectorDB() {
    console.log("🚀 Starting Vector DB Test...");

    // 1. Setup temporary DB path
    const dbPath = path.join(__dirname, 'test-lancedb');
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }

    console.log(`📂 Database Path: ${dbPath}`);

    try {
        // 2. Connect
        const db = await lancedb.connect(dbPath);
        console.log("✅ Connected to LanceDB");

        // 3. Prepare Dummy Data
        const tableName = "test_prompts";
        const data = [
            { id: 1, text: "Write a python script for scraping", vector: [0.1, 0.2, 0.3], category: "coding" },
            { id: 2, text: "Explain quantum physics like I am 5", vector: [0.3, 0.2, 0.1], category: "science" },
            { id: 3, text: "Write a poem about robots", vector: [0.1, 0.4, 0.2], category: "creative" }
        ];

        // 4. Create Table and Add Data
        console.log(`📝 Creating/Overwriting table '${tableName}'...`);
        const table = await db.createTable(tableName, data, { mode: 'overwrite' });
        console.log("✅ Table created and data inserted");

        // 5. Perform Vector Search (Nearest Neighbor)
        // Searching for something close to "coding" (vector [0.1, 0.2, 0.3])
        const queryVector = [0.1, 0.25, 0.35];
        console.log("🔍 Searching for nearest neighbors to query vector...");

        const results = await table.vectorSearch(queryVector)
            .limit(2)
            .toArray();

        console.log("📊 Search Results:");
        results.forEach(r => {
            console.log(`   - ID: ${r.id}, Text: "${r.text}", Distance: ${r._distance}`);
        });

        // 6. Verify Results
        if (results.length > 0 && results[0].id === 1) {
            console.log("✅ TEST SUCCESS: 'Coding' prompt was the top match.");
        } else {
            console.error("❌ TEST FAILURE: Expected ID 1 to be top match.");
        }

    } catch (error) {
        console.error("❌ TEST FAILED with error:", error);
    } finally {
        // Cleanup (optional)
        // fs.rmSync(dbPath, { recursive: true, force: true });
        console.log("🏁 Test Complete.");
    }
}

testVectorDB();
