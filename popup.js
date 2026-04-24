document.addEventListener('DOMContentLoaded', function () {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                  navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    
    const errorElement = document.getElementById('error');
    const toastOpacityToggle = document.getElementById('toastOpacityToggle');
    const opacityLevelDisplay = document.getElementById('opacityLevel');
    const chatVisibilityToggle = document.getElementById('chatVisibilityToggle');
    const uninstallButton = document.getElementById('uninstallButton');
    
    // Custom API Configuration elements
    const useCustomAPIToggle = document.getElementById('useCustomAPI');
    const customAPIForm = document.getElementById('customAPIForm');
    const aiProviderSelect = document.getElementById('aiProvider');
    const customEndpointDiv = document.getElementById('customEndpointDiv');
    const customEndpointInput = document.getElementById('customEndpoint');
    const apiKeyInput = document.getElementById('apiKey');
    const modelNameInput = document.getElementById('modelName');
    const testAPIConfigButton = document.getElementById('testAPIConfig');
    
    // Free AI Provider toggle
    const providerBtns = document.querySelectorAll('.provider-btn');

    const CUSTOM_API_STORAGE_KEYS = ['useCustomAPI', 'aiProvider', 'customEndpoint', 'customAPIKey', 'customModelName'];

    // Load AI Provider from storage
    chrome.storage.local.get(['freeAIProvider'], (result) => {
        const provider = result.freeAIProvider || 'gemini';
        providerBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.provider === provider);
        });
    });

    // Handle AI Provider selection
    providerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            providerBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            chrome.storage.local.set({ freeAIProvider: e.target.dataset.provider });
            showError(`Switched to ${e.target.dataset.provider === 'gemini' ? 'Gemini' : 'ChatGPT'}`, 2000);
        });
    });

    // Debounced auto-save function for API configuration
    let saveTimeout;
    function autoSaveAPIConfig() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            const apiKey = apiKeyInput?.value?.trim();
            const aiProvider = aiProviderSelect?.value;
            const customEndpoint = customEndpointInput?.value?.trim();
            const modelName = modelNameInput?.value?.trim();
            const useCustomAPI = useCustomAPIToggle?.checked;

            if (useCustomAPI && apiKey) {
                try {
                    await chrome.storage.local.set({
                        useCustomAPI: true,
                        aiProvider: aiProvider,
                        customEndpoint: customEndpoint,
                        customAPIKey: apiKey,
                        customModelName: modelName
                    });
                    console.log('API configuration auto-saved');
                    showError('API configuration saved', 1500);
                } catch (error) {
                    console.error('Error auto-saving API configuration:', error);
                    showError('Failed to save API configuration', 2000);
                }
            }
        }, 1000);
    }

    // Function to update all shortcuts based on platform
    function updateShortcutsForPlatform() {
        const shortcutMappings = {
            'Control + Shift + T': isMac ? 'Control + Shift + T' : 'Alt + Shift + T',
            'Control + Shift + H': isMac ? 'Control + Shift + H' : 'Alt + Shift + H',
            'Option + Shift + A': isMac ? 'Option + Shift + A' : 'Alt + Shift + A',
            'Option + Shift + S': isMac ? 'Option + Shift + S' : 'Alt + Shift + S',
            'Option + Shift + M': isMac ? 'Option + Shift + M' : 'Alt + Shift + M',
            'Option + Shift + N': isMac ? 'Option + Shift + N' : 'Alt + Shift + N',
            'Option + Shift + V': isMac ? 'Option + Shift + V' : 'Alt + Shift + V',
            'Option + C': isMac ? 'Option + C' : 'Alt + C',
            'Option + O': isMac ? 'Option + O' : 'Alt + O'
        };

        document.querySelectorAll('.shortcut-key').forEach(element => {
            const currentText = element.textContent.trim();
            if (shortcutMappings[currentText]) {
                element.textContent = shortcutMappings[currentText];
            }
        });

        const opacityShortcutInfo = document.querySelector('.toggle-info');
        if (opacityShortcutInfo && opacityShortcutInfo.textContent.includes('Shortcut:')) {
            opacityShortcutInfo.textContent = `Shortcut: ${isMac ? 'Option + O' : 'Alt + O'}`;
        }
    }

    // Tab Functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    function showError(message, duration = 5000) {
        errorElement.innerText = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.innerText = '';
            errorElement.classList.add('hidden');
        }, duration);
    }

    // Toast Opacity
    function initializeOpacityLevel() {
        chrome.storage.local.get(['toastOpacityLevel'], (result) => {
            if (result.toastOpacityLevel) {
                opacityLevelDisplay.textContent = capitalizeFirstLetter(result.toastOpacityLevel);
            } else {
                opacityLevelDisplay.textContent = 'High';
            }
        });
    }
    
    // Chat Icon Visibility
    function initializeChatVisibility() {
        if (chatVisibilityToggle) {
            chrome.storage.local.get(['chatIconVisible'], (result) => {
                // Default is true if not set
                chatVisibilityToggle.checked = result.chatIconVisible !== false;
            });

            chatVisibilityToggle.addEventListener('change', function() {
                const isVisible = this.checked;
                chrome.storage.local.set({ chatIconVisible: isVisible }, () => {
                    showError(isVisible ? 'Chat icon will be visible' : 'Chat icon will be hidden', 2000);
                });
            });
        }
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    if (toastOpacityToggle) {
        toastOpacityToggle.addEventListener('click', function() {
            chrome.runtime.sendMessage({ action: 'toggleToastOpacity' }, (response) => {
                if (response && response.success) {
                    opacityLevelDisplay.textContent = capitalizeFirstLetter(response.level);
                    showError(`Toast opacity set to: ${capitalizeFirstLetter(response.level)}`, 2000);
                }
            });
        });
    }

    // Load API Config
    function loadAPIConfiguration() {
        chrome.storage.local.get(CUSTOM_API_STORAGE_KEYS, (result) => {
            if (result.useCustomAPI) {
                useCustomAPIToggle.checked = true;
                customAPIForm.classList.remove('hidden');
            } else {
                useCustomAPIToggle.checked = false;
                customAPIForm.classList.add('hidden');
            }
            if (result.aiProvider) {
                aiProviderSelect.value = result.aiProvider;
                if (result.aiProvider === 'custom') {
                    customEndpointDiv.classList.remove('hidden');
                } else {
                    customEndpointDiv.classList.add('hidden');
                }
            } else {
                customEndpointDiv.classList.add('hidden');
            }
            if (result.customEndpoint && customEndpointInput) customEndpointInput.value = result.customEndpoint;
            if (result.customAPIKey && apiKeyInput) apiKeyInput.value = result.customAPIKey;
            if (result.customModelName && modelNameInput) modelNameInput.value = result.customModelName;
        });
    }

    // Custom API toggle
    if (useCustomAPIToggle) {
        useCustomAPIToggle.addEventListener('change', async function() {
            if (this.checked) {
                customAPIForm.classList.remove('hidden');
                autoSaveAPIConfig();
            } else {
                customAPIForm.classList.add('hidden');
                await chrome.storage.local.remove(CUSTOM_API_STORAGE_KEYS);
                if (aiProviderSelect) aiProviderSelect.selectedIndex = 0;
                if (customEndpointDiv) customEndpointDiv.classList.add('hidden');
                if (apiKeyInput) apiKeyInput.value = '';
                if (customEndpointInput) customEndpointInput.value = '';
                if (modelNameInput) modelNameInput.value = '';
            }
        });
    }

    // API inputs auto-save
    [aiProviderSelect, apiKeyInput, customEndpointInput, modelNameInput].forEach(element => {
        if (element) {
            element.addEventListener('input', autoSaveAPIConfig);
            element.addEventListener('change', autoSaveAPIConfig);
        }
    });

    if (aiProviderSelect) {
        aiProviderSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customEndpointDiv.classList.remove('hidden');
            } else {
                customEndpointDiv.classList.add('hidden');
            }
        });
    }

    if (testAPIConfigButton) {
        testAPIConfigButton.addEventListener('click', async function() {
            if (!useCustomAPIToggle.checked) {
                showError('Please enable Custom API first');
                return;
            }
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                showError('Please enter an API Key');
                return;
            }
            
            testAPIConfigButton.textContent = 'Testing...';
            testAPIConfigButton.disabled = true;
            
            try {
                chrome.runtime.sendMessage({
                    action: 'testCustomAPI',
                    config: {
                        useCustomAPI: true,
                        aiProvider: aiProviderSelect.value,
                        customEndpoint: customEndpointInput.value.trim(),
                        apiKey: apiKey,
                        modelName: modelNameInput.value.trim()
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        showError('Extension error. Is the service worker running?');
                    } else if (response && response.success) {
                        showError('Connection successful!', 3000);
                        document.getElementById('error').style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
                        setTimeout(() => {
                            document.getElementById('error').style.backgroundColor = '';
                        }, 3000);
                    } else {
                        showError(response ? response.error : 'Connection failed');
                    }
                    testAPIConfigButton.textContent = 'Test Connection';
                    testAPIConfigButton.disabled = false;
                });
            } catch (error) {
                showError('Error testing configuration');
                testAPIConfigButton.textContent = 'Test Connection';
                testAPIConfigButton.disabled = false;
            }
        });
    }

    if (uninstallButton) {
        uninstallButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to uninstall Pass?')) {
                chrome.management.uninstallSelf({ showConfirmDialog: true });
            }
        });
    }

    // Initializations
    loadAPIConfiguration();
    initializeOpacityLevel();
    initializeChatVisibility();
    updateShortcutsForPlatform();
});
