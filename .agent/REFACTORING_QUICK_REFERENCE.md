# Quick Reference: Refactored Variable Names

## PromptLaboratory Component (PromptLabNew.tsx)

### Component
- ~~`PromptLabNew`~~ → **`PromptLaboratory`**

### State Variables
- ~~`currentFramework`~~ → **`selectedFramework`**
- ~~`isTemplateDrawerOpen`~~ → **`isTemplateDrawerVisible`**
- ~~`isSaveModalOpen`~~ → **`isSaveModalVisible`**
- ~~`isConfigModalOpen`~~ → **`isConfigurationModalVisible`**
- ~~`activeConfigTab`~~ → **`selectedConfigurationTab`**
- ~~`isOutputModalOpen`~~ → **`isOutputModalVisible`**
- ~~`isComplexityModalOpen`~~ → **`isComplexitySelectionVisible`**
- ~~`isFormValid`~~ → **`areAllRequiredFieldsFilled`**
- ~~`tokenBreakdownItems`~~ → **`tokenUsageBreakdownDisplay`**

### Functions
- ~~`handleExport`~~ → **`exportPromptToFile`**
- ~~`handleSaveNew`~~ → **`saveNewPrompt`**
- ~~`handleUpdate`~~ → **`updateExistingPrompt`**
- ~~`handleSaveWithTitle`~~ → **`savePromptWithTitle`**

### Token Calculation Variables
- ~~`core`~~ → **`coreIdeaTokens`**
- ~~`tones`~~ → **`tonesTokens`**
- ~~`fieldsSum`~~ → **`totalFieldsTokens`**
- ~~`visibleSum`~~ → **`visibleTokensSum`**
- ~~`inputOverhead`~~ → **`inputOverheadTokens`**
- ~~`genTokens`~~ → **`generatedContentTokens`**
- ~~`outputOverhead`~~ → **`outputOverheadTokens`**
- ~~`acc`~~ → **`accumulator`**
- ~~`f`~~ → **`frameworkField`** / **`field`**

## PromptOutput Component

### State Variables
- ~~`loadingStep`~~ → **`currentLoadingStep`**
- ~~`isVisualMode`~~ → **`isVisualModeEnabled`**
- ~~`textSteps`~~ → **`loadingStepMessages`**

### Functions
- ~~`handleReplace`~~ → **`replaceTextInPrompt`**

### Variables
- ~~`updated`~~ → **`updatedPrompt`**
- ~~`t1`~~ → **`firstStepTimer`**
- ~~`t2`~~ → **`secondStepTimer`**

## Search & Replace Guide

If you need to update any remaining references, use these patterns:

```bash
# Component name
PromptLabNew → PromptLaboratory

# State variables
currentFramework → selectedFramework
isTemplateDrawerOpen → isTemplateDrawerVisible
isSaveModalOpen → isSaveModalVisible
isConfigModalOpen → isConfigurationModalVisible
activeConfigTab → selectedConfigurationTab
isOutputModalOpen → isOutputModalVisible
isComplexityModalOpen → isComplexitySelectionVisible
isFormValid → areAllRequiredFieldsFilled
tokenBreakdownItems → tokenUsageBreakdownDisplay

# Functions
handleExport → exportPromptToFile
handleSaveNew → saveNewPrompt
handleUpdate → updateExistingPrompt
handleSaveWithTitle → savePromptWithTitle
handleReplace → replaceTextInPrompt

# Setters (auto-updated)
setIsTemplateDrawerOpen → setIsTemplateDrawerVisible
setIsSaveModalOpen → setIsSaveModalVisible
setIsConfigModalOpen → setIsConfigurationModalVisible
setActiveConfigTab → setSelectedConfigurationTab
setIsOutputModalOpen → setIsOutputModalVisible
setIsComplexityModalOpen → setIsComplexitySelectionVisible
setIsVisualMode → setIsVisualModeEnabled
setLoadingStep → setCurrentLoadingStep
```

## Import Updates

### App.tsx
```typescript
// Old
import { PromptLabNew } from '@/pages/PromptLabNew';

// New
import { PromptLaboratory } from '@/pages/PromptLabNew';
```

### Component Usage
```typescript
// Old
<PromptLabNew isSidebarOpen={isSidebarOpen} />

// New
<PromptLaboratory isSidebarOpen={isSidebarOpen} />
```

---

**Note:** All changes are backward compatible at the functionality level. Only internal naming has changed.
