'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchCriteria } from '@/components/admin/AdvancedSearch';

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  criteria: SearchCriteria[];
  category: 'common' | 'recent' | 'suggested' | 'custom';
  useCount: number;
  lastUsed?: Date;
  isPublic: boolean;
  tags: string[];
}

export interface FilterSuggestion {
  id: string;
  title: string;
  description: string;
  criteria: SearchCriteria[];
  confidence: number;
  reason: string;
  category: 'pattern' | 'context' | 'trending' | 'similar';
}

export interface UserPattern {
  criteria: SearchCriteria[];
  frequency: number;
  lastUsed: Date;
  context: string;
}

export interface UseSmartFilteringOptions {
  context: 'roles' | 'calendar' | 'prefixes' | 'global';
  enablePatternLearning?: boolean;
  enableContextualSuggestions?: boolean;
  maxSuggestions?: number;
}

export const useSmartFiltering = (options: UseSmartFilteringOptions) => {
  const {
    context,
    enablePatternLearning = true,
    enableContextualSuggestions = true,
    maxSuggestions = 5
  } = options;

  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [recentFilters, setRecentFilters] = useState<SearchCriteria[][]>([]);
  const [isLearning, setIsLearning] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem(`smart-filters-presets-${context}`);
      if (savedPresets) {
        const parsedPresets = JSON.parse(savedPresets).map((preset: any) => ({
          ...preset,
          lastUsed: preset.lastUsed ? new Date(preset.lastUsed) : undefined
        }));
        setFilterPresets(parsedPresets);
      }

      const savedPatterns = localStorage.getItem(`smart-filters-patterns-${context}`);
      if (savedPatterns) {
        const parsedPatterns = JSON.parse(savedPatterns).map((pattern: any) => ({
          ...pattern,
          lastUsed: new Date(pattern.lastUsed)
        }));
        setUserPatterns(parsedPatterns);
      }

      const savedRecent = localStorage.getItem(`smart-filters-recent-${context}`);
      if (savedRecent) {
        setRecentFilters(JSON.parse(savedRecent));
      }
    } catch (error) {
      console.error('Failed to load smart filtering data:', error);
    }
  }, [context]);

  // Save data to localStorage
  const saveData = useCallback(() => {
    try {
      localStorage.setItem(`smart-filters-presets-${context}`, JSON.stringify(filterPresets));
      localStorage.setItem(`smart-filters-patterns-${context}`, JSON.stringify(userPatterns));
      localStorage.setItem(`smart-filters-recent-${context}`, JSON.stringify(recentFilters));
    } catch (error) {
      console.error('Failed to save smart filtering data:', error);
    }
  }, [context, filterPresets, userPatterns, recentFilters]);

  // Save data when state changes
  useEffect(() => {
    saveData();
  }, [saveData]);

  // Learn from user patterns
  const learnFromUsage = useCallback((criteria: SearchCriteria[]) => {
    if (!enablePatternLearning || criteria.length === 0) return;

    setIsLearning(true);

    // Find existing pattern or create new one
    const criteriaKey = JSON.stringify(criteria.sort((a, b) => a.field.localeCompare(b.field)));
    const existingPatternIndex = userPatterns.findIndex(
      pattern => JSON.stringify(pattern.criteria.sort((a, b) => a.field.localeCompare(b.field))) === criteriaKey
    );

    if (existingPatternIndex >= 0) {
      // Update existing pattern
      const updatedPatterns = [...userPatterns];
      updatedPatterns[existingPatternIndex] = {
        ...updatedPatterns[existingPatternIndex],
        frequency: updatedPatterns[existingPatternIndex].frequency + 1,
        lastUsed: new Date()
      };
      setUserPatterns(updatedPatterns);
    } else {
      // Create new pattern
      const newPattern: UserPattern = {
        criteria,
        frequency: 1,
        lastUsed: new Date(),
        context
      };
      setUserPatterns(prev => [...prev, newPattern]);
    }

    // Add to recent filters
    setRecentFilters(prev => {
      const newRecent = [criteria, ...prev.filter(f => 
        JSON.stringify(f) !== JSON.stringify(criteria)
      )].slice(0, 10);
      return newRecent;
    });

    setTimeout(() => setIsLearning(false), 500);
  }, [enablePatternLearning, userPatterns, context]);

  // Generate contextual suggestions
  const generateContextualSuggestions = useCallback((): FilterSuggestion[] => {
    if (!enableContextualSuggestions) return [];

    const suggestions: FilterSuggestion[] = [];

    // Pattern-based suggestions
    const frequentPatterns = userPatterns
      .filter(pattern => pattern.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    frequentPatterns.forEach((pattern, index) => {
      suggestions.push({
        id: `pattern-${index}`,
        title: 'ตัวกรองที่คุณใช้บ่อย',
        description: `ใช้ ${pattern.frequency} ครั้ง`,
        criteria: pattern.criteria,
        confidence: Math.min(0.9, pattern.frequency / 10),
        reason: 'ตามรูปแบบการใช้งานของคุณ',
        category: 'pattern'
      });
    });

    // Context-specific suggestions
    const contextSuggestions = getContextSpecificSuggestions(context);
    suggestions.push(...contextSuggestions);

    // Similar pattern suggestions
    if (recentFilters.length > 0) {
      const lastFilter = recentFilters[0];
      const similarPatterns = userPatterns.filter(pattern => 
        pattern.criteria.some(c => lastFilter.some(lc => lc.field === c.field))
      );

      similarPatterns.slice(0, 2).forEach((pattern, index) => {
        suggestions.push({
          id: `similar-${index}`,
          title: 'ตัวกรองที่คล้ายกัน',
          description: 'ตัวกรองที่มีเงื่อนไขคล้ายกับที่คุณเพิ่งใช้',
          criteria: pattern.criteria,
          confidence: 0.6,
          reason: 'ตามความคล้ายคลึงกับการค้นหาล่าสุด',
          category: 'similar'
        });
      });
    }

    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }, [enableContextualSuggestions, userPatterns, recentFilters, context, maxSuggestions]);

  // Get context-specific suggestions
  const getContextSpecificSuggestions = (ctx: string): FilterSuggestion[] => {
    const suggestions: Record<string, FilterSuggestion[]> = {
      roles: [
        {
          id: 'active-roles-suggestion',
          title: 'บทบาทที่มีผู้ใช้งาน',
          description: 'แสดงเฉพาะบทบาทที่มีคนใช้งานอยู่',
          criteria: [{ field: 'role.userCount', operator: 'greater_than', value: 0 }],
          confidence: 0.8,
          reason: 'บทบาทที่มีผู้ใช้มักได้รับความสนใจมากกว่า',
          category: 'context'
        },
        {
          id: 'system-roles-suggestion',
          title: 'บทบาทระบบ',
          description: 'บทบาทที่สำคัญต่อการทำงานของระบบ',
          criteria: [{ field: 'role.isSystem', operator: 'equals', value: true }],
          confidence: 0.7,
          reason: 'บทบาทระบบต้องการการดูแลเป็นพิเศษ',
          category: 'context'
        }
      ],
      calendar: [
        {
          id: 'current-events-suggestion',
          title: 'กิจกรรมปัจจุบัน',
          description: 'กิจกรรมที่กำลังดำเนินการอยู่',
          criteria: [
            { field: 'calendar.startDate', operator: 'less_than', value: new Date().toISOString().split('T')[0] },
            { field: 'calendar.endDate', operator: 'greater_than', value: new Date().toISOString().split('T')[0] }
          ],
          confidence: 0.85,
          reason: 'กิจกรรมปัจจุบันมีความสำคัญสูง',
          category: 'context'
        },
        {
          id: 'upcoming-events-suggestion',
          title: 'กิจกรรมที่จะมาถึง',
          description: 'กิจกรรมในอนาคต 30 วัน',
          criteria: [
            { field: 'calendar.startDate', operator: 'between', value: [
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            ]}
          ],
          confidence: 0.75,
          reason: 'การเตรียมการล่วงหน้าเป็นสิ่งสำคัญ',
          category: 'context'
        }
      ],
      prefixes: [
        {
          id: 'default-prefixes-suggestion',
          title: 'คำนำหน้าเริ่มต้น',
          description: 'คำนำหน้าที่ใช้บ่อยที่สุด',
          criteria: [{ field: 'prefix.isDefault', operator: 'equals', value: true }],
          confidence: 0.8,
          reason: 'คำนำหน้าเริ่มต้นใช้งานบ่อยที่สุด',
          category: 'context'
        },
        {
          id: 'academic-prefixes-suggestion',
          title: 'คำนำหน้าวิชาการ',
          description: 'คำนำหน้าสำหรับบุคลากรทางวิชาการ',
          criteria: [{ field: 'prefix.category', operator: 'equals', value: 'academic' }],
          confidence: 0.7,
          reason: 'ในสถาบันการศึกษาคำนำหน้าวิชาการมีความสำคัญ',
          category: 'context'
        }
      ]
    };

    return suggestions[ctx] || [];
  };

  // Save filter preset
  const saveFilterPreset = useCallback((preset: Omit<FilterPreset, 'id' | 'useCount' | 'lastUsed'>) => {
    const newPreset: FilterPreset = {
      ...preset,
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      useCount: 0,
      lastUsed: new Date()
    };

    setFilterPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  // Delete filter preset
  const deleteFilterPreset = useCallback((presetId: string) => {
    setFilterPresets(prev => prev.filter(preset => preset.id !== presetId));
  }, []);

  // Use filter preset
  const useFilterPreset = useCallback((preset: FilterPreset) => {
    // Update usage statistics
    setFilterPresets(prev => prev.map(p => 
      p.id === preset.id 
        ? { ...p, useCount: p.useCount + 1, lastUsed: new Date() }
        : p
    ));

    // Learn from this usage
    learnFromUsage(preset.criteria);

    return preset.criteria;
  }, [learnFromUsage]);

  // Get quick filters (most used presets)
  const getQuickFilters = useCallback(() => {
    return filterPresets
      .filter(preset => preset.category === 'common' || preset.useCount > 5)
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5);
  }, [filterPresets]);

  // Get trending filters (based on recent usage patterns)
  const getTrendingFilters = useCallback(() => {
    const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return userPatterns
      .filter(pattern => pattern.lastUsed > recentThreshold)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map((pattern, index) => ({
        id: `trending-${index}`,
        title: 'ตัวกรองยอดนิยม',
        description: `ใช้ ${pattern.frequency} ครั้งในสัปดาห์นี้`,
        criteria: pattern.criteria,
        confidence: 0.7,
        reason: 'ตามแนวโน้มการใช้งานล่าสุด',
        category: 'trending' as const
      }));
  }, [userPatterns]);

  // Export user patterns and presets
  const exportFilterData = useCallback(() => {
    const exportData = {
      context,
      presets: filterPresets,
      patterns: userPatterns,
      recentFilters,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-filters-${context}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [context, filterPresets, userPatterns, recentFilters]);

  // Import filter data
  const importFilterData = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          
          if (importedData.presets) {
            const validPresets = importedData.presets.map((preset: any) => ({
              ...preset,
              lastUsed: preset.lastUsed ? new Date(preset.lastUsed) : undefined
            }));
            setFilterPresets(prev => [...prev, ...validPresets]);
          }

          if (importedData.patterns) {
            const validPatterns = importedData.patterns.map((pattern: any) => ({
              ...pattern,
              lastUsed: new Date(pattern.lastUsed)
            }));
            setUserPatterns(prev => [...prev, ...validPatterns]);
          }

          if (importedData.recentFilters) {
            setRecentFilters(prev => [...importedData.recentFilters, ...prev].slice(0, 10));
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }, []);

  // Clear all learning data
  const clearLearningData = useCallback(() => {
    setUserPatterns([]);
    setRecentFilters([]);
    localStorage.removeItem(`smart-filters-patterns-${context}`);
    localStorage.removeItem(`smart-filters-recent-${context}`);
  }, [context]);

  // Get filter statistics
  const getFilterStats = useCallback(() => {
    const totalPresets = filterPresets.length;
    const customPresets = filterPresets.filter(p => p.category === 'custom').length;
    const totalPatterns = userPatterns.length;
    const frequentPatterns = userPatterns.filter(p => p.frequency >= 3).length;
    const mostUsedPreset = filterPresets.reduce((prev, current) => 
      (prev.useCount > current.useCount) ? prev : current, filterPresets[0]
    );

    return {
      totalPresets,
      customPresets,
      publicPresets: filterPresets.filter(p => p.isPublic).length,
      totalPatterns,
      frequentPatterns,
      recentFiltersCount: recentFilters.length,
      mostUsedPreset,
      learningEnabled: enablePatternLearning
    };
  }, [filterPresets, userPatterns, recentFilters, enablePatternLearning]);

  // Generate smart suggestions
  const smartSuggestions = useMemo(() => {
    return generateContextualSuggestions();
  }, [generateContextualSuggestions]);

  return {
    // State
    filterPresets,
    userPatterns,
    recentFilters,
    smartSuggestions,
    isLearning,

    // Actions
    learnFromUsage,
    saveFilterPreset,
    deleteFilterPreset,
    useFilterPreset,
    exportFilterData,
    importFilterData,
    clearLearningData,

    // Utilities
    getQuickFilters,
    getTrendingFilters,
    getFilterStats
  };
};

export default useSmartFiltering;