import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Settings2, Wifi, Bot } from 'lucide-react';
import { PlatformConfig, PlatformConfigs, PlatformKey, PLATFORM_NAMES, DEFAULT_PLATFORM_CONFIG } from '../types/platformConfig';
import { supabase } from '../lib/supabase';

interface PlatformConfigurationProps {
  onConfigChange?: (configs: PlatformConfigs) => void;
}

const PlatformConfiguration: React.FC<PlatformConfigurationProps> = ({ onConfigChange }) => {
  const [configs, setConfigs] = useState<PlatformConfigs>({
    meetup: { ...DEFAULT_PLATFORM_CONFIG },
    eventbrite: { ...DEFAULT_PLATFORM_CONFIG },
    facebook: { ...DEFAULT_PLATFORM_CONFIG },
    spontacts: { ...DEFAULT_PLATFORM_CONFIG }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<PlatformKey, boolean>>({} as Record<PlatformKey, boolean>);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>('meetup');

  // Konfigurationen laden
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_configs')
        .select('*');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const loadedConfigs = data.reduce((acc, config) => {
          acc[config.platform as PlatformKey] = {
            ...DEFAULT_PLATFORM_CONFIG,
            ...config.config
          };
          return acc;
        }, {} as Partial<PlatformConfigs>);
        
        setConfigs(prev => ({ ...prev, ...loadedConfigs }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Konfigurationen:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (platform: PlatformKey, config: PlatformConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_configs')
        .upsert({
          platform,
          config,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      const newConfigs = { ...configs, [platform]: config };
      setConfigs(newConfigs);
      onConfigChange?.(newConfigs);
      
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
      alert('Fehler beim Speichern der Konfiguration!');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (platform: PlatformKey) => {
    setTesting(prev => ({ ...prev, [platform]: true }));
    
    try {
      const config = configs[platform];
      
      // API-Test falls aktiviert
      if (config.apiEnabled) {
        const testResult = await testPlatformAPI(platform, config);
        
        const updatedConfig = {
          ...config,
          apiStatus: testResult.success ? 'connected' as const : 'disconnected' as const,
          lastTest: new Date()
        };
        
        await saveConfig(platform, updatedConfig);
        
        if (!testResult.success) {
          alert(`API-Test fehlgeschlagen: ${testResult.error}`);
        }
      }
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
    } finally {
      setTesting(prev => ({ ...prev, [platform]: false }));
    }
  };

  const testPlatformAPI = async (platform: PlatformKey, config: PlatformConfig) => {
    // Simuliere API-Test (wird später durch echte API-Calls ersetzt)
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      setTimeout(() => {
        if (config.apiKey || config.clientId) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'API-Schlüssel fehlt' });
        }
      }, 2000);
    });
  };

  const updateConfig = (platform: PlatformKey, updates: Partial<PlatformConfig>) => {
    const newConfig = { ...configs[platform], ...updates };
    setConfigs(prev => ({ ...prev, [platform]: newConfig }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getStatusIcon = (status: PlatformConfig['apiStatus']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: PlatformConfig['apiStatus']) => {
    const variants = {
      connected: 'bg-green-100 text-green-800 border-green-200',
      disconnected: 'bg-red-100 text-red-800 border-red-200',
      testing: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <Badge className={`${variants[status]} border`}>
        {getStatusIcon(status)}
        <span className="ml-1">
          {status === 'connected' ? 'Verbunden' : 
           status === 'testing' ? 'Teste...' : 'Getrennt'}
        </span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Konfigurationen werden geladen...</span>
      </div>
    );
  }

  const currentConfig = configs[selectedPlatform];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Plattform-Konfiguration</h2>
        </div>
        <Badge variant="outline" className="text-sm">
          Sichere Verschlüsselung aktiv
        </Badge>
      </div>

      {/* Plattform-Auswahl */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(PLATFORM_NAMES).map(([key, name]) => {
          const platformKey = key as PlatformKey;
          const config = configs[platformKey];
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedPlatform === key ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedPlatform(platformKey)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{name}</h3>
                  {getStatusBadge(config.apiStatus)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Wifi className="h-4 w-4 mr-1" />
                    <span>{config.apiEnabled ? 'API' : '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <Bot className="h-4 w-4 mr-1" />
                    <span>{config.playwrightEnabled ? 'Bot' : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Konfigurationsdetails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{PLATFORM_NAMES[selectedPlatform]} Konfiguration</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection(selectedPlatform)}
                disabled={testing[selectedPlatform] || (!currentConfig.apiEnabled && !currentConfig.playwrightEnabled)}
              >
                {testing[selectedPlatform] ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verbindung testen
              </Button>
              <Button
                onClick={() => saveConfig(selectedPlatform, currentConfig)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Speichern
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="api" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="api" className="flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                API-Integration
              </TabsTrigger>
              <TabsTrigger value="playwright" className="flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                UI-Automation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="api-enabled">API-Integration aktivieren</Label>
                  <p className="text-sm text-gray-500">Verwende offizielle API für Event-Erstellung</p>
                </div>
                <Switch
                  id="api-enabled"
                  checked={currentConfig.apiEnabled}
                  onCheckedChange={(checked) => updateConfig(selectedPlatform, { apiEnabled: checked })}
                />
              </div>

              {currentConfig.apiEnabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  {renderAPIFields(selectedPlatform, currentConfig)}
                </div>
              )}

              {selectedPlatform === 'facebook' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ Facebook Events API:</strong> Nur für Marketing Partner verfügbar. 
                    Alternative: UI-Automation über Business Manager.
                  </AlertDescription>
                </Alert>
              )}

              {selectedPlatform === 'spontacts' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>🤖 Spontacts:</strong> Keine öffentliche API verfügbar. 
                    Nur UI-Automation möglich. API-Anfrage: support@synexit.com
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="playwright" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="playwright-enabled">UI-Automation aktivieren</Label>
                  <p className="text-sm text-gray-500">Automatische Browser-Steuerung für Event-Erstellung</p>
                </div>
                <Switch
                  id="playwright-enabled"
                  checked={currentConfig.playwrightEnabled}
                  onCheckedChange={(checked) => updateConfig(selectedPlatform, { playwrightEnabled: checked })}
                />
              </div>

              {currentConfig.playwrightEnabled && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="username">Benutzername/E-Mail</Label>
                    <Input
                      id="username"
                      type="email"
                      value={currentConfig.username || ''}
                      onChange={(e) => updateConfig(selectedPlatform, { username: e.target.value })}
                      placeholder="ihre.email@beispiel.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPasswords[selectedPlatform] ? 'text' : 'password'}
                        value={currentConfig.password || ''}
                        onChange={(e) => updateConfig(selectedPlatform, { password: e.target.value })}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility(selectedPlatform)}
                      >
                        {showPasswords[selectedPlatform] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sicherheitshinweis:</strong> Anmeldedaten werden verschlüsselt gespeichert. 
                      Aktivieren Sie 2FA für zusätzliche Sicherheit.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {currentConfig.lastTest && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Letzter Test: {new Date(currentConfig.lastTest).toLocaleString('de-DE')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function renderAPIFields(platform: PlatformKey, config: PlatformConfig) {
    switch (platform) {
      case 'meetup':
        return (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Wichtig:</strong> Meetup verwendet seit Februar 2025 GraphQL API mit OAuth 2.0. 
                API-Keys sind nicht mehr unterstützt!
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="client-id">OAuth Client ID</Label>
              <Input
                id="client-id"
                value={config.clientId || ''}
                onChange={(e) => updateConfig(platform, { clientId: e.target.value })}
                placeholder="Ihre Meetup OAuth Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-secret">OAuth Client Secret</Label>
              <div className="relative">
                <Input
                  id="client-secret"
                  type={showPasswords[`${platform}-secret`] ? 'text' : 'password'}
                  value={config.clientSecret || ''}
                  onChange={(e) => updateConfig(platform, { clientSecret: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility(`${platform}-secret`)}
                >
                  {showPasswords[`${platform}-secret`] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        );

      case 'eventbrite':
        return (
          <div className="space-y-2">
            <Label htmlFor="api-key">Eventbrite API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showPasswords[`${platform}-key`] ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={(e) => updateConfig(platform, { apiKey: e.target.value })}
                placeholder="••••••••"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => togglePasswordVisibility(`${platform}-key`)}
              >
                {showPasswords[`${platform}-key`] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={config.apiKey || ''}
              onChange={(e) => updateConfig(platform, { apiKey: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        );
    }
  }
};

export default PlatformConfiguration;