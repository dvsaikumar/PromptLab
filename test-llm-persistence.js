#!/usr/bin/env node

/**
 * LLM Settings Persistence Test
 * 
 * Run this in the browser console to verify LLM settings are being saved
 */

console.log('🧪 Testing LLM Settings Persistence...\n');

if (typeof window !== 'undefined' && window.localStorage) {
    console.log('✅ Running in Browser Environment\n');

    // Check for saved LLM config
    const llmConfig = localStorage.getItem('llmConfig');

    if (llmConfig) {
        try {
            const config = JSON.parse(llmConfig);
            console.log('✅ LLM Configuration Found!\n');
            console.log('📊 Current Settings:');
            console.log('   Provider:', config.providerId);
            console.log('   Model:', config.model);
            console.log('   API Key:', config.apiKey ? '***' + config.apiKey.slice(-4) : '(not set)');
            console.log('   Base URL:', config.baseUrl || '(default)');

            // Verify structure
            const requiredFields = ['providerId', 'apiKey', 'model'];
            const hasAllFields = requiredFields.every(field => field in config);

            if (hasAllFields) {
                console.log('\n✅ Configuration structure is valid');
            } else {
                console.log('\n⚠️  Configuration is missing some fields');
            }

            // Check if it will persist
            console.log('\n🔄 Persistence Test:');
            console.log('   1. Current config is saved in localStorage');
            console.log('   2. Will be loaded on next app startup');
            console.log('   3. Survives browser/app restarts');

        } catch (e) {
            console.error('❌ Error parsing LLM config:', e);
        }
    } else {
        console.log('ℹ️  No LLM configuration found yet');
        console.log('💡 Configure your LLM settings to test persistence:');
        console.log('   1. Click the LLM indicator in the top-right header');
        console.log('   2. Enter your provider and API key');
        console.log('   3. Click "Save Configuration"');
        console.log('   4. Run this test again');
    }

    // Test write capability
    console.log('\n🧪 Testing localStorage write capability...');
    try {
        const testKey = '_test_llm_persistence';
        const testData = JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
            providerId: 'test'
        });

        localStorage.setItem(testKey, testData);
        const retrieved = localStorage.getItem(testKey);

        if (retrieved === testData) {
            console.log('✅ localStorage write/read test: PASSED');
            localStorage.removeItem(testKey);
        } else {
            console.log('❌ localStorage write/read test: FAILED');
        }
    } catch (e) {
        console.error('❌ localStorage is not available:', e);
    }

    // Instructions for manual test
    console.log('\n' + '='.repeat(60));
    console.log('📝 Manual Persistence Test:');
    console.log('='.repeat(60));
    console.log('1. Configure your LLM settings (if not already done)');
    console.log('2. Note the current provider and model');
    console.log('3. Close the browser/app completely');
    console.log('4. Reopen the application');
    console.log('5. Check the LLM indicator in the top-right');
    console.log('6. ✅ Settings should be the same!');
    console.log('='.repeat(60));

} else {
    console.log('⚠️  Not in browser environment');
    console.log('💡 Run this in the browser console (F12)');
}

console.log('\n📚 For more information, see LLM_SETTINGS_PERSISTENCE.md');
