// Candidate List Component
// Displays candidates with filtering, search, pagination, and layout options

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Skeleton,
  Alert,
  Pagination,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { CandidateCard } from './CandidateCard';
import { candidateService } from '../../services/candidateService';
import { usePermissions } from '../../hooks';
import { 
  Candidate, 
  CandidateFilterDto, 
  PaginatedCandidateResponse,
  ExperienceLevel 
} from '../../types/candidate.types';
import { Permission } from '../../types/user.types';

export interface CandidateListProps {
  initialFilters?: CandidateFilterDto;
  title?: string;
  showHeader?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showLayoutToggle?: boolean;
  showActions?: boolean;
  defaultLayout?: 'grid' | 'list';
  onCandidateSelect?: (candidate: Candidate) => void;
  selectionMode?: boolean;
}

export const CandidateList: React.FC<CandidateListProps> = ({
  initialFilters = {},
  title = "Candidates",
  showHeader = true,
  showFilters = true,
  showPagination = true,
  showLayoutToggle = true,
  showActions = true,
  defaultLayout = 'grid',
  onCandidateSelect,
  selectionMode = false
}) => {
  // Hooks
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'grid' | 'list'>(defaultLayout);
  const [showFiltersDialog, setShowFiltersDialog] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12); // Items per page

  // Filter state
  const [filters, setFilters] = useState<CandidateFilterDto>({
    page: 1,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters
  });
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [positionFilter, setPositionFilter] = useState(filters.position || '');
  const [experienceFilter, setExperienceFilter] = useState(filters.experienceLevel || '');

  // Permission checks
  const canCreate = hasPermission(Permission.CREATE_CANDIDATE);
  const canExport = hasPermission(Permission.EXPORT_DATA);

  // Fetch candidates
  const fetchCandidates = useCallback(async (filterParams: CandidateFilterDto) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedCandidateResponse = await candidateService.getCandidates(filterParams);
      
      setCandidates(response.candidates);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError('Failed to load candidates. Please try again.');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    const newFilters: CandidateFilterDto = {
      ...filters,
      search: searchTerm.trim() || undefined,
      position: positionFilter || undefined,
      experienceLevel: experienceFilter as ExperienceLevel || undefined,
      page: 1 // Reset to first page when filtering
    };
    
    setFilters(newFilters);
    fetchCandidates(newFilters);
  }, [filters, searchTerm, positionFilter, experienceFilter, fetchCandidates]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters: CandidateFilterDto = {
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    setFilters(clearedFilters);
    setSearchTerm('');
    setPositionFilter('');
    setExperienceFilter('');
    fetchCandidates(clearedFilters);
  }, [limit, fetchCandidates]);

  // Handle pagination
  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchCandidates(newFilters);
  }, [filters, fetchCandidates]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchCandidates(filters);
  }, [filters, fetchCandidates]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      await candidateService.exportCandidates('csv', filters);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [filters]);

  // Handle candidate actions
  const handleEdit = useCallback((candidate: Candidate) => {
    navigate(`/candidates/edit/${candidate.id}`);
  }, [navigate]);

  const handleDelete = useCallback(async (candidate: Candidate) => {
    // This would typically show a confirmation dialog
    console.log('Delete candidate:', candidate.id);
    // After deletion, refresh the list
    handleRefresh();
  }, [handleRefresh]);

  const handleView = useCallback((candidate: Candidate) => {
    if (onCandidateSelect) {
      onCandidateSelect(candidate);
    } else {
      navigate(`/candidates/${candidate.id}`);
    }
  }, [navigate, onCandidateSelect]);

  const handleDownloadCV = useCallback(async (candidate: Candidate) => {
    if (candidate.cvFileName) {
      try {
        await candidateService.downloadCV(candidate.id);
      } catch (err) {
        console.error('CV download failed:', err);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCandidates(filters);
  }, [fetchCandidates, filters]); // Dependency on fetchCandidates and filters

  // Search debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        applyFilters();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, applyFilters, filters.search]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (positionFilter) count++;
    if (experienceFilter) count++;
    return count;
  }, [searchTerm, positionFilter, experienceFilter]);

  // Loading skeleton
  const renderSkeleton = () => (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(auto-fill, minmax(280px, 1fr))',
          md: 'repeat(auto-fill, minmax(320px, 1fr))',
          lg: 'repeat(auto-fill, minmax(340px, 1fr))',
        },
        gap: {
          xs: 2,
          sm: 2.5,
          md: 3,
        },
      }}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Paper 
          key={index} 
          sx={{ 
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            minHeight: 240,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton 
              variant="circular" 
              width={48} 
              height={48} 
              sx={{ mr: 2 }} 
            />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="80%" height={24} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
          </Box>
          <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="50%" height={20} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </Paper>
      ))}
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      {showHeader && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {title}
              {total > 0 && (
                <Chip 
                  label={`${total} candidates`} 
                  size="small" 
                  sx={{ ml: 2 }} 
                  variant="outlined"
                />
              )}
            </Typography>

            {showActions && (
              <Stack direction="row" spacing={1}>
                <Tooltip title="Refresh">
                  <IconButton onClick={handleRefresh} disabled={loading}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>

                {canExport && (
                  <Tooltip title="Export to CSV">
                    <IconButton onClick={handleExport} disabled={loading}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}

                {showLayoutToggle && (
                  <>
                    <Tooltip title="Grid View">
                      <IconButton 
                        onClick={() => setLayout('grid')}
                        color={layout === 'grid' ? 'primary' : 'default'}
                      >
                        <GridViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="List View">
                      <IconButton 
                        onClick={() => setLayout('list')}
                        color={layout === 'list' ? 'primary' : 'default'}
                      >
                        <ListViewIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            )}
          </Box>

          {/* Filters */}
          {showFilters && (
            <Paper 
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 2, sm: 2, md: 3 }} 
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                {/* Search */}
                <TextField
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 280, md: 320 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                  size="small"
                />

                {/* Advanced Filters Button */}
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setShowFiltersDialog(true)}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 120 },
                    borderRadius: 2,
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  Filters
                  {activeFiltersCount > 0 && (
                    <Chip 
                      label={activeFiltersCount} 
                      size="small" 
                      color="primary" 
                      sx={{ 
                        ml: 1, 
                        minWidth: 20, 
                        height: 20,
                        '& .MuiChip-label': {
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        },
                      }} 
                    />
                  )}
                </Button>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="text"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                    color="error"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      minWidth: { xs: '100%', sm: 'auto' },
                      '&:hover': {
                        backgroundColor: 'error.light',
                        color: 'error.contrastText',
                      },
                    }}
                  >
                    Clear
                  </Button>
                )}

                <Box sx={{ flexGrow: 1 }} />

                {/* Results count */}
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    fontWeight: 500,
                    textAlign: { xs: 'center', sm: 'right' },
                  }}
                >
                  {loading ? 'Loading...' : `${total} results`}
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : candidates.length === 0 ? (
        <Paper 
          sx={{ 
            p: { xs: 3, sm: 4, md: 6 }, 
            textAlign: 'center',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
            border: '2px dashed',
            borderColor: 'divider',
            minHeight: 300,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box 
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              borderRadius: '50%',
              backgroundColor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <PersonIcon 
              sx={{ 
                fontSize: { xs: 40, sm: 50 }, 
                color: 'text.disabled' 
              }} 
            />
          </Box>
          
          <Typography 
            variant="h5" 
            color="text.secondary" 
            gutterBottom
            sx={{
              fontWeight: 600,
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            No candidates found
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            paragraph
            sx={{
              maxWidth: 400,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              lineHeight: 1.6,
            }}
          >
            {activeFiltersCount > 0 
              ? 'Try adjusting your search filters or clearing them to see all candidates.'
              : 'Get started by adding your first candidate to the system.'
            }
          </Typography>
          
          {canCreate && activeFiltersCount === 0 && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/candidates/new')}
              sx={{ 
                mt: 2,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Add First Candidate
            </Button>
          )}
        </Paper>
      ) : (
        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: layout === 'grid' 
              ? {
                  xs: '1fr',
                  sm: 'repeat(auto-fill, minmax(280px, 1fr))',
                  md: 'repeat(auto-fill, minmax(320px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(340px, 1fr))',
                }
              : '1fr',
            gap: {
              xs: layout === 'grid' ? 2 : 1.5,
              sm: layout === 'grid' ? 2.5 : 2,
              md: layout === 'grid' ? 3 : 2,
            },
            // Ensure proper spacing
            width: '100%',
            minHeight: loading ? '400px' : 'auto',
          }}
        >
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              variant={layout === 'list' ? 'compact' : 'default'}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
              onDownloadCV={handleDownloadCV}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            disabled={loading}
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Floating Action Button */}
      {canCreate && showActions && (
        <Fab
          color="primary"
          aria-label="add candidate"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              transform: 'scale(1.1)',
              boxShadow: '0 6px 24px rgba(25, 118, 210, 0.6)',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
          }}
          onClick={() => navigate('/candidates/new')}
        >
          <AddIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </Fab>
      )}

      {/* Advanced Filters Dialog */}
      <Dialog 
        open={showFiltersDialog} 
        onClose={() => setShowFiltersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Advanced Filters</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                label="Position"
              >
                <MenuItem value="">All Positions</MenuItem>
                <MenuItem value="Frontend Developer">Frontend Developer</MenuItem>
                <MenuItem value="Backend Developer">Backend Developer</MenuItem>
                <MenuItem value="Full Stack Developer">Full Stack Developer</MenuItem>
                <MenuItem value="DevOps Engineer">DevOps Engineer</MenuItem>
                <MenuItem value="Product Manager">Product Manager</MenuItem>
                <MenuItem value="UI/UX Designer">UI/UX Designer</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                label="Experience Level"
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value={ExperienceLevel.ENTRY_LEVEL}>Entry Level</MenuItem>
                <MenuItem value={ExperienceLevel.MID_LEVEL}>Mid Level</MenuItem>
                <MenuItem value={ExperienceLevel.SENIOR_LEVEL}>Senior Level</MenuItem>
                <MenuItem value={ExperienceLevel.EXECUTIVE}>Executive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFiltersDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => {
            applyFilters();
            setShowFiltersDialog(false);
          }} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateList;

