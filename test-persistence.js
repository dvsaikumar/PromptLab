#!/usr/bin/env node

/**
 * Database Persistence Test
 * 
 * This script tests that the database is properly persisting data
 * Run this in the browser console or as a Node script
 */

console.log('🧪 Testing Database Persistence...\n');

// Test for browser environment
if (typeof window !== 'undefined' && window.localStorage) {
    console.log('✅ Running in Browser Environment');
    console.log('📍 Testing localStorage persistence...\n');

    const testKey = 'saved_prompts';
    const existingData = localStorage.getItem(testKey);

    if (existingData) {
        try {
            const prompts = JSON.parse(existingData);
            console.log(`✅ Found ${prompts.length} saved prompts in localStorage`);
            console.log('📊 Sample prompt titles:');
            prompts.slice(0, 5).forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.title} (${p.framework})`);
            });
        } catch (e) {
            console.error('❌ Error parsing localStorage data:', e);
        }
    } else {
        console.log('ℹ️  No prompts found in localStorage yet');
        console.log('💡 Save a prompt to test persistence');
    }

    // Test write capability
    try {
        const testData = JSON.stringify([{ test: true, timestamp: new Date().toISOString() }]);
        localStorage.setItem('_test_persistence', testData);
        const retrieved = localStorage.getItem('_test_persistence');

        if (retrieved === testData) {
            console.log('\n✅ localStorage write/read test: PASSED');
            localStorage.removeItem('_test_persistence');
        } else {
            console.log('\n❌ localStorage write/read test: FAILED');
        }
    } catch (e) {
        console.error('\n❌ localStorage is not available:', e);
    }

} else if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
    console.log('✅ Running in Electron Environment');
    console.log('📍 Database should be at userData/prompts.db');
    console.log('💡 Check the DATABASE_PERSISTENCE.md file for location details');

} else {
    console.log('⚠️  Unknown environment');
    console.log('💡 Run this in the browser console or Electron app');
}

console.log('\n' + '='.repeat(50));
console.log('📚 For more information, see DATABASE_PERSISTENCE.md');
console.log('='.repeat(50));
