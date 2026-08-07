import { Box, Chip, Typography, useTheme } from '@mui/material';
import { CircularProgressWithContent } from '../CircularProgressWithContent';

type Props = {
  item: { id: string; name: string; availability: number };
  status: { label: string; color: string; bgcolor: string };
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isHovered?: boolean;
};

export const LocationMapAvailabilityWidgetItem = ({
  item,
  status,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isHovered,
}: Props) => {
  const theme = useTheme();

  return (
    <Box
      key={item.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: '6px 16px',
        borderTop: 1,
        borderColor: theme.palette.divider,
        backgroundColor: isHovered ? theme.palette.action.hover : undefined,
        '&:hover': onClick ? { backgroundColor: theme.palette.action.hover } : undefined,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CircularProgressWithContent
        value={item.availability}
        size={36}
        ringThickness={3}
        content={
          <Typography color='text.secondary' fontSize='11px' fontWeight={500}>
            {item.availability}%
          </Typography>
        }
      />
      <Typography
        variant='h4'
        sx={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: theme.palette.text.primary,
          textOverflow: 'ellipsis',
        }}
      >
        {item.name}
      </Typography>
      <Chip
        label={status.label}
        sx={{
          maxHeight: '19px',
          color: status.color,
          bgcolor: status.bgcolor,
        }}
      />
    </Box>
  );
};
