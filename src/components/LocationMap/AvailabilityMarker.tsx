import { memo, useCallback } from 'react';
import { Marker, MarkerEvent } from '@vis.gl/react-maplibre';
import { Typography, useTheme } from '@mui/material';
import { strokeFromFill } from './mapUtils';
import { MARKER_SIZE } from './mapConstants';
import { HOVER_MARKER_COLOR } from './availability';
import { ColorUtils } from 'src/utils/ColorUtils';

type Props = {
  id: string;
  lat: number;
  lng: number;
  availability: number;
  label: string;
  showLabel: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  /** Screen-space offset in px — used to fan out co-located markers. */
  pixelOffset?: [number, number];
};

/**
 * A single availability bubble rendered as a DOM marker. The inner markup and
 * CSS classes are the contract with the widget's external stylesheet
 * (availability-marker*, availability-tooltip) and must not be renamed.
 */
const AvailabilityMarkerBase = ({
  id,
  lat,
  lng,
  availability,
  label,
  showLabel,
  isHovered,
  onSelect,
  onHover,
  pixelOffset,
}: Props) => {
  const theme = useTheme();
  const fill = isHovered ? HOVER_MARKER_COLOR : ColorUtils.getProgressColor(theme, availability);
  const stroke = strokeFromFill(fill);
  const size = isHovered ? MARKER_SIZE.hover : MARKER_SIZE.base;

  const handleClick = useCallback(
    (event: MarkerEvent<MouseEvent>) => {
      event.originalEvent?.stopPropagation();
      onSelect(id);
    },
    [onSelect, id]
  );
  const handleMouseEnter = useCallback(() => onHover(id), [onHover, id]);
  const handleMouseLeave = useCallback(() => onHover(null), [onHover]);

  return (
    <Marker
      longitude={lng}
      latitude={lat}
      anchor='center'
      offset={pixelOffset}
      onClick={handleClick}
      style={{ zIndex: isHovered ? 3 : 1 }}
    >
      <div
        className='availability-marker-icon'
        style={{ width: MARKER_SIZE.hover, height: MARKER_SIZE.hover }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={`availability-marker ${isHovered ? 'availability-marker--hover' : ''}`}
          style={{ background: fill, borderColor: stroke, width: size, height: size }}
        />
        {showLabel && (
          <div className='availability-tooltip'>
            <Typography sx={{ color: 'common.white', fontWeight: 500, fontSize: '10px' }}>
              {label}
            </Typography>
          </div>
        )}
      </div>
    </Marker>
  );
};

export const AvailabilityMarker = memo(AvailabilityMarkerBase);
