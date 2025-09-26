import React, { useState, useCallback, useMemo } from 'react';
import {
  TextField,
  Autocomplete,
  Button,
  Chip,
  Box,
  Collapse,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  FilterAlt,
  ExpandMore,
  ExpandLess,
  Clear,
  Search,
  BookmarkBorder,
  Bookmark,
  Settings
} from '@mui/icons-material';

// Filter interfaces
export interface SearchFilterState {
  search: string;
  position: string;
  major: string;
  appointmentStatus: string;
  department: string;
  company: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface AdvancedSearchFilterProps {
  filters: SearchFilterState;
  onFiltersChange: (filters: Partial<SearchFilterState>) => void;
  onSearch?: (searchTerm: string) => void;
  loading?: boolean;
  validationErrors?: string[];
  
  // Filter options
  positionOptions?: FilterOption[];
  majorOptions?: FilterOption[];
  appointmentStatusOptions?: FilterOption[];
  departmentOptions?: FilterOption[];
  companyOptions?: FilterOption[];
  
  // Advanced features
  showAdvancedFilters?: boolean;
  enablePresets?: boolean;
  enableServerSideSearch?: boolean;
  searchPlaceholder?: string;
  
  // Callbacks
  onReset?: () => void;
  onSavePreset?: (name: string, filters: SearchFilterState) => void;
  onLoadPreset?: (filters: SearchFilterState) => void;
}

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
  validationErrors = [],
  positionOptions = [],
  majorOptions = [],
  appointmentStatusOptions = [
    { value: 'นัดหมายแล้ว', label: 'นัดหมายแล้ว' },
    { value: 'รอนัดหมาย', label: 'รอนัดหมาย' },
    { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น' },
    { value: 'ยกเลิก', label: 'ยกเลิก' }
  ],
  departmentOptions = [],
  companyOptions = [],
  showAdvancedFilters = true,
  enablePresets = false,
  enableServerSideSearch = false,
  searchPlaceholder = "ค้นหาชื่อ-สกุล, รหัสประจำตัว, บริษัท",
  onReset,
  onSavePreset,
  onLoadPreset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onFiltersChange({ search: value });
    
    // Trigger search immediately for server-side search
    if (enableServerSideSearch && onSearch) {
      onSearch(value);
    }
  }, [onFiltersChange, onSearch, enableServerSideSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((field: keyof SearchFilterState, value: string | null) => {
    onFiltersChange({ [field]: value || '' });
  }, [onFiltersChange]);

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    if (onSearch) {
      onSearch(filters.search);
    }
  }, [onSearch, filters.search]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (onReset) {
      onReset();
    } else {
      onFiltersChange({
        search: '',
        position: '',
        major: '',
        appointmentStatus: '',
        department: '',
        company: ''
      });
    }
  }, [onReset, onFiltersChange]);

  // Handle save preset
  const handleSavePreset = useCallback(() => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
    }
  }, [presetName, onSavePreset, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => value && value.trim() !== '').length;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Box>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {validationErrors.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Main Search Row */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        {/* Search Input */}
        <TextField
          name="search"
          placeholder={searchPlaceholder}
          label="ค้นหา"
          size="small"
          fullWidth
          value={filters.search}
          onChange={handleSearchChange}
          disabled={loading}
          InputProps={{
            endAdornment: filters.search && (
              <IconButton
                size="small"
                onClick={() => handleFilterChange('search', '')}
                disabled={loading}
              >
                <Clear fontSize="small" />
              </IconButton>
            )
          }}
          sx={{ minWidth: 300 }}
        />

        {/* Quick Filters */}
        <Autocomplete
          options={positionOptions}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
          value={positionOptions.find(opt => opt.value === filters.position) || null}
          onChange={(_, value) => handleFilterChange('position', value?.value || null)}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="ตำแหน่ง"
              placeholder="กรุณาเลือก"
              size="small"
            />
          )}
          sx={{ minWidth: 200 }}
        />

        <Autocomplete
          options={majorOptions}
          getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
          value={majorOptions.find(opt => opt.value === filters.major) || null}
          onChange={(_, value) => handleFilterChange('major', value?.value || null)}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="สาขาวิชา"
              placeholder="กรุณาเลือก"
              size="small"
            />
          )}
          sx={{ minWidth: 200 }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!enableServerSideSearch && (
            <Button
              variant="contained"
              onClick={handleSearchClick}
              disabled={loading}
              startIcon={<Search />}
              size="small"
            >
              ค้นหา
            </Button>
          )}

          <Tooltip title={`ตัวกรอง${hasActiveFilters ? ` (${activeFilterCount})` : ''}`}>
            <IconButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              color={hasActiveFilters ? 'primary' : 'default'}
              size="small"
            >
              <FilterAlt />
              {hasActiveFilters && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  color="primary"
                  sx={{ 
                    position: 'absolute', 
                    top: -8, 
                    right: -8, 
                    minWidth: 20, 
                    height: 20 
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          {hasActiveFilters && (
            <Tooltip title="ล้างตัวกรอง">
              <IconButton onClick={handleReset} size="small" color="error">
                <Clear />
              </IconButton>
            </Tooltip>
          )}

          {showAdvancedFilters && (
            <IconButton
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
            >
              {showAdvanced ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Collapse in={showAdvanced}>
          <Box sx={{ 
            p: 2, 
            border: 1, 
            borderColor: 'divider', 
            borderRadius: 1, 
            bgcolor: 'grey.50',
            mb: 2 
          }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              ตัวกรองขั้นสูง
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* Appointment Status Filter */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>สถานะนัดหมาย</InputLabel>
                <Select
                  value={filters.appointmentStatus}
                  onChange={(e) => handleFilterChange('appointmentStatus', e.target.value)}
                  disabled={loading}
                  label="สถานะนัดหมาย"
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {appointmentStatusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                      {option.count && ` (${option.count})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Department Filter */}
              <Autocomplete
                options={departmentOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                value={departmentOptions.find(opt => opt.value === filters.department) || null}
                onChange={(_, value) => handleFilterChange('department', value?.value || null)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="แผนก"
                    placeholder="กรุณาเลือก"
                    size="small"
                  />
                )}
                sx={{ minWidth: 200 }}
              />

              {/* Company Filter */}
              <Autocomplete
                options={companyOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                value={companyOptions.find(opt => opt.value === filters.company) || null}
                onChange={(_, value) => handleFilterChange('company', value?.value || null)}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="บริษัท"
                    placeholder="กรุณาเลือก"
                    size="small"
                  />
                )}
                sx={{ minWidth: 250 }}
              />
            </Box>

            {/* Preset Management */}
            {enablePresets && (
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="ชื่อชุดตัวกรอง"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    sx={{ width: 200 }}
                  />
                  <Button
                    size="small"
                    onClick={handleSavePreset}
                    disabled={!presetName.trim() || !hasActiveFilters}
                    startIcon={<Bookmark />}
                  >
                    บันทึกชุดตัวกรอง
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
            ตัวกรองที่ใช้:
          </Typography>
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value.trim() === '') return null;
            
            let label = '';
            switch (key) {
              case 'search':
                label = `ค้นหา: "${value}"`;
                break;
              case 'position':
                label = `ตำแหน่ง: ${value}`;
                break;
              case 'major':
                label = `สาขา: ${value}`;
                break;
              case 'appointmentStatus':
                label = `สถานะ: ${value}`;
                break;
              case 'department':
                label = `แผนก: ${value}`;
                break;
              case 'company':
                label = `บริษัท: ${value}`;
                break;
              default:
                label = `${key}: ${value}`;
            }

            return (
              <Chip
                key={key}
                label={label}
                onDelete={() => handleFilterChange(key as keyof SearchFilterState, '')}
                size="small"
                variant="outlined"
                disabled={loading}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default AdvancedSearchFilter;