import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Plus, X, Terminal } from 'lucide-react-native';
import { useApp } from '@/contexts/app-context';
import * as Haptics from 'expo-haptics';

interface WebsiteForm {
  name: string;
  url: string;
}

export default function AddWebsiteScreen() {
  const insets = useSafeAreaInsets();
  const { addWebsite, isAddingWebsite } = useApp();
  const [websites, setWebsites] = useState<WebsiteForm[]>([
    { name: '', url: '' }
  ]);

  const addWebsiteForm = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    console.log('[Terminal] > add-target');
    setWebsites([...websites, { name: '', url: '' }]);
  };

  const removeWebsiteForm = (index: number) => {
    if (websites.length > 1) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      console.log(`[Terminal] > rm target_${String(index + 1).padStart(2, '0')}`);
      setWebsites(websites.filter((_, i) => i !== index));
    }
  };

  const updateWebsite = (index: number, field: keyof WebsiteForm, value: string) => {
    const updated = [...websites];
    updated[index][field] = value;
    setWebsites(updated);
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const validWebsites = websites.filter(w => w.name.trim() && w.url.trim());
    
    if (validWebsites.length === 0) {
      Alert.alert('VALIDATION_ERROR', 'At least one target required with name and URL.');
      return;
    }

    const invalidUrls = validWebsites.filter(w => !validateUrl(w.url));
    if (invalidUrls.length > 0) {
      Alert.alert('URL_ERROR', 'Invalid URL format. Include http:// or https://');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      console.log('[Terminal] > exec add-website');
      for (const website of validWebsites) {
        addWebsite({
          name: website.name.trim(),
          url: website.url.trim(),
          status: 'checking',
        });
      }

      router.back();
    } catch (error) {
      Alert.alert('EXEC_ERROR', 'Failed to execute command. Retry?');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'ADD_WEBSITES',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#00ff00',
          headerTitleStyle: {
            fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
            fontSize: 16,
          },
          headerRight: () => (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isAddingWebsite}
            >
              <Terminal color={isAddingWebsite ? '#555555' : '#00ff00'} size={16} />
              <Text
                style={[
                  styles.saveButtonText,
                  { 
                    opacity: isAddingWebsite ? 0.5 : 1,
                  },
                ]}
              >
                {isAddingWebsite ? 'EXEC...' : 'EXEC'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.terminalHeader}>
            <Text style={styles.prompt}>$</Text>
            <Text style={styles.command}>add-website --monitor</Text>
          </View>
          <Text style={styles.description}>
            {'> Configure websites for uptime monitoring'}
            {'\n> Enter name and URL for each target'}
          </Text>

          {websites.map((website, index) => (
            <View key={index} style={styles.websiteForm}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  TARGET_{String(index + 1).padStart(2, '0')}
                </Text>
                {websites.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeWebsiteForm(index)}
                  >
                    <X size={16} color="#ff6b6b" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NAME:</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrompt}>{'>'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="website_name"
                    placeholderTextColor="#555555"
                    value={website.name}
                    onChangeText={(text) => updateWebsite(index, 'name', text)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>URL:</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrompt}>{'>'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com"
                    placeholderTextColor="#555555"
                    value={website.url}
                    onChangeText={(text) => updateWebsite(index, 'url', text)}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={addWebsiteForm}
          >
            <Plus size={16} color="#00ff00" />
            <Text style={styles.addMoreText}>
              ADD_TARGET
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    marginRight: 8,
  },
  command: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
  },
  description: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#808080',
    lineHeight: 18,
    marginBottom: 24,
  },
  websiteForm: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    padding: 16,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
  },
  removeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#808080',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  inputPrompt: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#ffffff',
    padding: 0,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#00ff00',
    borderStyle: 'dashed' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addMoreText: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    color: '#00ff00',
    fontWeight: 'bold' as const,
    marginLeft: 8,
  },
});