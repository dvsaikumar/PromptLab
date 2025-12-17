import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    platform: process.platform,
    db: {
        savePrompt: (prompt) => ipcRenderer.invoke('db:savePrompt', prompt),
        getAllPrompts: () => ipcRenderer.invoke('db:getAllPrompts'),
        getPromptById: (id) => ipcRenderer.invoke('db:getPromptById', id),
        getPromptsByFramework: (framework) => ipcRenderer.invoke('db:getPromptsByFramework', framework),
        updatePrompt: (id, updates) => ipcRenderer.invoke('db:updatePrompt', id, updates),
        deletePrompt: (id) => ipcRenderer.invoke('db:deletePrompt', id),
        searchPrompts: (query) => ipcRenderer.invoke('db:searchPrompts', query)
    },
    vectordb: {
        add: (collection, data) => ipcRenderer.invoke('vectordb:add', collection, data),
        search: (collection, vector, limit) => ipcRenderer.invoke('vectordb:search', collection, vector, limit),
        list: () => ipcRenderer.invoke('vectordb:list')
    }
});
