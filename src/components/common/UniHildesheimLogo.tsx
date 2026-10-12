import { Box } from '@mui/material';

interface UniHildesheimLogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
}

export const UniHildesheimLogo = ({
  size = 40,
  showText = false,
  color,
}: UniHildesheimLogoProps) => {
  const red = '#E30613';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-label="Stiftung Universität Hildesheim Logo"
      >
        <defs>
          {/* Top text arc */}
          <path
            id="uniHildesheimTopArc"
            d="M 12,62 A 48,48 0 1,1 108,62"
            fill="none"
          />
          {/* Bottom text arc */}
          <path
            id="uniHildesheimBottomArc"
            d="M 28,74 A 46,46 0 0,0 92,74"
            fill="none"
          />
        </defs>

        {/* Circular curved text matching the official emblem */}
        <text
          fill={color || 'currentColor'}
          fontSize="9"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          letterSpacing="0.2px"
        >
          <textPath href="#uniHildesheimTopArc" startOffset="50%" textAnchor="middle">
            Stiftung Universität Hildesheim
          </textPath>
        </text>

        <text
          fill={color || 'currentColor'}
          fontSize="9.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="700"
          letterSpacing="0.5px"
        >
          <textPath href="#uniHildesheimBottomArc" startOffset="50%" textAnchor="middle">
            2003
          </textPath>
        </text>

        {/* Central iconic red 3-bar emblem with diagonal slice */}
        <g id="emblem-bars">
          {/* Bar 1 (Left): x: 38..48 */}
          {/* Top left polygon */}
          <polygon
            points="38,36 48,36 48,56 38,60"
            fill={red}
          />
          {/* Bottom left polygon */}
          <polygon
            points="38,67 48,63 48,82 38,82"
            fill={red}
          />

          {/* Bar 2 (Middle): x: 55..65 */}
          {/* Top middle polygon */}
          <polygon
            points="55,36 65,36 65,49 55,53"
            fill={red}
          />
          {/* Bottom middle polygon */}
          <polygon
            points="55,60 65,56 65,82 55,82"
            fill={red}
          />

          {/* Bar 3 (Right): x: 72..82 */}
          {/* Top right polygon */}
          <polygon
            points="72,36 82,36 82,42 72,46"
            fill={red}
          />
          {/* Bottom right polygon */}
          <polygon
            points="72,53 82,49 82,82 72,82"
            fill={red}
          />
        </g>
      </svg>

      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            Stiftung Universität Hildesheim
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: '0.75rem',
              color: 'text.secondary',
              letterSpacing: '0.02em',
            }}
          >
            Software Systems Engineering
          </Box>
        </Box>
      )}
    </Box>
  );
};
