import { ExploreOutlined } from '@mui/icons-material';
import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { Z_INDEX } from './mapConstants';

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
};

type Props = {
  breadcrumbs: BreadcrumbItem[];
};

/** Top-left navigation trail overlaid on the map. */
export const LocationMapBreadcrumb = ({ breadcrumbs }: Props) => {
  const lastIndex = breadcrumbs.length - 1;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: Z_INDEX.mapOverlay,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        px: 1,
        py: 0.5,
      }}
    >
      <ExploreOutlined sx={{ color: 'text.secondary' }} />
      <Breadcrumbs separator='/' aria-label='location breadcrumbs'>
        {breadcrumbs.map((crumb, index) => {
          const isCurrent = index === lastIndex || !crumb.onClick;

          return isCurrent ? (
            <Typography key={crumb.label} variant='subtitle2' color='text.secondary'>
              {crumb.label}
            </Typography>
          ) : (
            <Link
              key={crumb.label}
              component='button'
              variant='subtitle2'
              underline='hover'
              color='text.secondary'
              onClick={crumb.onClick}
            >
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};
