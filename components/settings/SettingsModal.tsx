'use client';

import React from 'react';
import { X, Settings2, Key, Palette, Shield, Download, Upload, Sparkles } from 'lucide-react';
import { Modal, ModalHeader, ModalContent } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useSettingsStore } from '@/lib/store/settings-store';
import { useChatStore } from '@/lib/store/chat-store';
import { useToast } from '@/lib/store/toast-store';
import { cn } from '@/lib/utils';
import { AIProvider } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'api-keys' | 'appearance' | 'privacy';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('general');
  const [clearDataModalOpen, setClearDataModalOpen] = React.useState(false);
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importData, setImportData] = React.useState<any>(null);
  const [showCustomThemeBuilder, setShowCustomThemeBuilder] = React.useState(false);
  const { preferences, apiKeys, updatePreferences, setTheme, addAPIKey, removeAPIKey } = useSettingsStore();
  const { chats, importChats } = useChatStore();
  const { success, error } = useToast();
  
  const [customColors, setCustomColors] = React.useState({
    primary: '217.2 91.2% 59.8%',
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    accent: '240 4.8% 95.9%',
  });

  // Initialize custom colors from preferences
  React.useEffect(() => {
    if (preferences.customTheme) {
      setCustomColors(preferences.customTheme);
    }
  }, [preferences.customTheme]);

  const [apiKeyInputs, setApiKeyInputs] = React.useState<Record<AIProvider, string>>({
    resita: '',
    nekolabs: '',
  });

  React.useEffect(() => {
    // Load existing API keys (masked)
    apiKeys.forEach((key) => {
      setApiKeyInputs((prev) => ({
        ...prev,
        [key.provider]: '••••••••••••••••',
      }));
    });
  }, [apiKeys]);

  const tabs = [
    { id: 'general' as TabType, label: 'General', icon: Settings2 },
    { id: 'api-keys' as TabType, label: 'API Keys', icon: Key },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
    { id: 'privacy' as TabType, label: 'Data & Privacy', icon: Shield },
  ];

  const handleSaveAPIKey = (provider: AIProvider) => {
    const key = apiKeyInputs[provider];
    if (key && !key.startsWith('••')) {
      addAPIKey({ provider, key, isActive: true });
      success('API Key Saved', `${provider} API key has been saved successfully`);
      setApiKeyInputs((prev) => ({ ...prev, [provider]: '••••••••••••••••' }));
    }
  };

  const handleRemoveAPIKey = (provider: AIProvider) => {
    removeAPIKey(provider);
    setApiKeyInputs((prev) => ({ ...prev, [provider]: '' }));
    success('API Key Removed', `${provider} API key has been removed`);
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system' | 'rose' | 'blue' | 'green' | 'purple' | 'custom') => {
    if (theme === 'custom') {
      setShowCustomThemeBuilder(true);
    } else {
      setTheme(theme);
      success('Theme Updated', `Theme changed to ${theme}`);
    }
  };

  const handleSaveCustomTheme = () => {
    setTheme('custom', customColors);
    setShowCustomThemeBuilder(false);
    success('Custom Theme Saved', 'Your custom theme has been applied');
  };

  const handleExportData = () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        chats: chats,
        settings: preferences,
        apiKeys: apiKeys.map(key => ({ ...key, key: '***REDACTED***' })), // Don't export actual keys
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatbot-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('Data Exported', 'Your data has been downloaded successfully');
    } catch (err) {
      error('Export Failed', 'Failed to export your data. Please try again.');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate data structure
        if (!data.version || !data.chats || !data.settings) {
          error('Invalid File', 'The file format is not recognized. Please use a valid backup file.');
          return;
        }

        // Store data and show confirmation modal
        setImportData(data);
        setImportModalOpen(true);
      } catch (err) {
        error('Import Failed', 'Failed to read the file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleConfirmImport = () => {
    try {
      if (!importData) return;

      // Import chats
      if (importData.chats && Array.isArray(importData.chats)) {
        importChats(importData.chats);
      }

      // Import settings (excluding API keys for security)
      if (importData.settings) {
        const { theme, autoSave, showTokenCount, enableNotifications, customTheme } = importData.settings;
        updatePreferences({
          theme: theme || 'system',
          autoSave: autoSave !== undefined ? autoSave : true,
          showTokenCount: showTokenCount !== undefined ? showTokenCount : false,
          enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
          customTheme: customTheme || undefined,
        });
      }

      setImportModalOpen(false);
      setImportData(null);
      success('Import Successful', `Imported ${importData.chats?.length || 0} chat(s) successfully!`);
      
      // Reload to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      error('Import Failed', 'An error occurred during import. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-4xl">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
      </ModalHeader>

      <div className="flex min-h-[500px]">
        {/* Tabs Sidebar */}
        <div className="w-48 border-r p-4 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                activeTab === tab.id ? 'bg-accent' : 'hover:bg-muted'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto-save chats</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically save your chat history
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.autoSave}
                        onChange={(e) =>
                          updatePreferences({ autoSave: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Show token count</div>
                      <div className="text-sm text-muted-foreground">
                        Display token usage in messages
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.showTokenCount}
                        onChange={(e) =>
                          updatePreferences({ showTokenCount: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Enable notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Get notified about important updates
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.enableNotifications}
                        onChange={(e) =>
                          updatePreferences({ enableNotifications: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">API Keys</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure your AI provider API keys. Keys are stored securely in your browser.
                </p>

                <div className="space-y-4">
                  {/* Resita API Key */}
                  <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">Resita API</div>
                        <div className="text-xs text-muted-foreground">7 free models (ChatGPT, Claude, Gemini, etc.)</div>
                      </div>
                      {apiKeys.find((k) => k.provider === 'resita') && (
                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={apiKeyInputs.resita}
                        onChange={(e) =>
                          setApiKeyInputs((prev) => ({
                            ...prev,
                            resita: e.target.value,
                          }))
                        }
                        placeholder="Enter Resita API key (optional)"
                        className="flex-1"
                      />
                      <Button onClick={() => handleSaveAPIKey('resita')} size="sm">
                        Save
                      </Button>
                      {apiKeys.find((k) => k.provider === 'resita') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAPIKey('resita')}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Currently using default key: <code className="px-1 py-0.5 bg-muted rounded">key-veng</code>
                    </p>
                  </div>

                  {/* NekoLabs API Key */}
                  <div className="border rounded-lg p-4 bg-purple/5 border-purple/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">NekoLabs API</div>
                        <div className="text-xs text-muted-foreground">4 text models + GPT-5 image analysis (no key needed)</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full font-medium">
                        Free
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={apiKeyInputs.nekolabs}
                        onChange={(e) =>
                          setApiKeyInputs((prev) => ({
                            ...prev,
                            nekolabs: e.target.value,
                          }))
                        }
                        placeholder="No API key required"
                        className="flex-1"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ✨ Models: GPT-4o, GPT-4.1, GPT-5 Mini, GPT-5 Nano
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                
                <div className="space-y-6">
                  {/* Theme Selection */}
                  <div>
                    <label className="font-medium block mb-3">Theme</label>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      {(['light', 'dark', 'system', 'rose', 'blue', 'green', 'purple', 'custom'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => handleThemeChange(theme)}
                          className={cn(
                            'p-3 border-2 rounded-lg capitalize transition-all',
                            'hover:scale-105 active:scale-95',
                            preferences.theme === theme
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                              theme === 'light' && "bg-white border-2 border-gray-200",
                              theme === 'dark' && "bg-gray-900 border-2 border-gray-700",
                              theme === 'system' && "bg-gradient-to-br from-white to-gray-900",
                              theme === 'rose' && "bg-gradient-to-br from-rose-400 to-rose-600",
                              theme === 'blue' && "bg-gradient-to-br from-blue-400 to-blue-600",
                              theme === 'green' && "bg-gradient-to-br from-green-400 to-green-600",
                              theme === 'purple' && "bg-gradient-to-br from-purple-400 to-purple-600",
                              theme === 'custom' && "bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
                            )}>
                              {theme === 'light' && '☀️'}
                              {theme === 'dark' && '🌙'}
                              {theme === 'system' && '💻'}
                              {theme === 'rose' && '🌹'}
                              {theme === 'blue' && '💎'}
                              {theme === 'green' && '🌿'}
                              {theme === 'purple' && '🔮'}
                              {theme === 'custom' && <Sparkles className="h-5 w-5 text-white" />}
                            </div>
                            <span className="text-xs font-medium">{theme}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Theme Builder */}
                    {showCustomThemeBuilder && (
                      <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4 animate-slideUp">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Custom Theme Builder
                          </h4>
                          <button
                            onClick={() => setShowCustomThemeBuilder(false)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium block mb-2">Primary Color</label>
                            <input
                              type="color"
                              value={`hsl(${customColors.primary})`}
                              onChange={(e) => {
                                const color = e.target.value;
                                setCustomColors(prev => ({ ...prev, primary: color }));
                              }}
                              className="w-full h-12 rounded-lg cursor-pointer border-2 border-border"
                            />
                            <Input
                              value={customColors.primary}
                              onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                              placeholder="217.2 91.2% 59.8%"
                              className="mt-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-2">Background Color</label>
                            <input
                              type="color"
                              value={`hsl(${customColors.background})`}
                              onChange={(e) => {
                                const color = e.target.value;
                                setCustomColors(prev => ({ ...prev, background: color }));
                              }}
                              className="w-full h-12 rounded-lg cursor-pointer border-2 border-border"
                            />
                            <Input
                              value={customColors.background}
                              onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                              placeholder="0 0% 100%"
                              className="mt-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-2">Foreground Color</label>
                            <input
                              type="color"
                              value={`hsl(${customColors.foreground})`}
                              onChange={(e) => {
                                const color = e.target.value;
                                setCustomColors(prev => ({ ...prev, foreground: color }));
                              }}
                              className="w-full h-12 rounded-lg cursor-pointer border-2 border-border"
                            />
                            <Input
                              value={customColors.foreground}
                              onChange={(e) => setCustomColors(prev => ({ ...prev, foreground: e.target.value }))}
                              placeholder="240 10% 3.9%"
                              className="mt-2 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium block mb-2">Accent Color</label>
                            <input
                              type="color"
                              value={`hsl(${customColors.accent})`}
                              onChange={(e) => {
                                const color = e.target.value;
                                setCustomColors(prev => ({ ...prev, accent: color }));
                              }}
                              className="w-full h-12 rounded-lg cursor-pointer border-2 border-border"
                            />
                            <Input
                              value={customColors.accent}
                              onChange={(e) => setCustomColors(prev => ({ ...prev, accent: e.target.value }))}
                              placeholder="240 4.8% 95.9%"
                              className="mt-2 text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveCustomTheme} className="flex-1">
                            Apply Custom Theme
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setCustomColors({
                                primary: '217.2 91.2% 59.8%',
                                background: '0 0% 100%',
                                foreground: '240 10% 3.9%',
                                accent: '240 4.8% 95.9%',
                              });
                            }}
                          >
                            Reset
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          💡 Tip: Use HSL format (Hue Saturation Lightness) for best results. Example: "217.2 91.2% 59.8%"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="font-medium block mb-3">Font Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            updatePreferences({ fontSize: size });
                            success('Font Size Updated', `Font size changed to ${size}`);
                          }}
                          className={cn(
                            'p-4 border-2 rounded-lg capitalize transition-all',
                            'hover:scale-105 active:scale-95',
                            preferences.fontSize === size
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={cn(
                              "font-bold",
                              size === 'small' && "text-sm",
                              size === 'medium' && "text-base",
                              size === 'large' && "text-lg"
                            )}>
                              Aa
                            </div>
                            <span className="text-xs font-medium">{size}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Changes apply immediately to all text in the application
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Data & Privacy</h3>
                
                <div className="space-y-4">
                  {/* Storage Info */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Local Storage
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      All your chats, settings, and API keys are stored locally in your browser.
                      No data is sent to external servers except AI API calls.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Encrypted</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Private</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Offline Ready</span>
                      </div>
                    </div>
                  </div>

                  {/* Export & Import Data */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Your Data
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Download all your chats and settings as a JSON file. API keys will be redacted for security.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleExportData}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {chats.length} chat{chats.length !== 1 ? 's' : ''} ready
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Import Data
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Restore your chats and settings from a backup file.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Import Data
                        </Button>
                        <input
                          id="import-file"
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border-2 border-destructive/20 rounded-lg p-4 bg-destructive/5">
                    <div className="font-medium mb-2 text-destructive flex items-center gap-2">
                      ⚠️ Danger Zone
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will permanently delete all your chats, settings, and API keys.
                      This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setClearDataModalOpen(true)}
                    >
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      <ConfirmModal
        isOpen={clearDataModalOpen}
        onClose={() => setClearDataModalOpen(false)}
        onConfirm={() => {
          localStorage.clear();
          window.location.reload();
        }}
        title="Clear All Data"
        message="Are you sure you want to delete all your chats, settings, and API keys? This action cannot be undone and you will lose all your data permanently."
        confirmText="Yes, Delete Everything"
        cancelText="Cancel"
        variant="danger"
        icon="warning"
      />

      {/* Import Data Confirmation Modal */}
      <ConfirmModal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportData(null);
        }}
        onConfirm={handleConfirmImport}
        title="Import Data"
        message={`You are about to import ${importData?.chats?.length || 0} chat(s) and settings. This will merge with your existing data. Do you want to continue?`}
        confirmText="Yes, Import Data"
        cancelText="Cancel"
        variant="info"
        icon="info"
      />
    </Modal>
  );
};
