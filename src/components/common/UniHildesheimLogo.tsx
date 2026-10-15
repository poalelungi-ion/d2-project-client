import { useState } from 'react';
import { Box, useTheme } from '@mui/material';

interface UniHildesheimLogoProps {
  size?: number;
  showText?: boolean;
  color?: string;
  themeMode?: 'light' | 'dark' | 'auto';
}

const REMOTE_LIGHT_LOGO =
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b0/Universit%C3%A4t_Hildesheim_logo.svg/960px-Universit%C3%A4t_Hildesheim_logo.svg.png?utm_source=de.wikipedia.org&utm_campaign=index&utm_content=thumbnail';
const REMOTE_DARK_LOGO =
  'https://www.uni-hildesheim.de/literaturinstitut/wp-content/uploads/2020/02/uni-hi-logo.png';

export const UniHildesheimLogo = ({
  size = 40,
  showText = false,
  color,
  themeMode = 'auto',
}: UniHildesheimLogoProps) => {
  const theme = useTheme();
  const isDark = themeMode === 'auto' ? theme.palette.mode === 'dark' : themeMode === 'dark';
  const [imgError, setImgError] = useState(false);
  const [usedRemote, setUsedRemote] = useState(false);

  // Local static asset paths in public/ with remote URL fallbacks
  const primarySrc = isDark ? '/uni-hi-logo-dark.png' : '/uni-hi-logo-light.png';
  const fallbackSrc = isDark ? REMOTE_DARK_LOGO : REMOTE_LIGHT_LOGO;
  const currentSrc = usedRemote ? fallbackSrc : primarySrc;

  const handleError = () => {
    if (!usedRemote) {
      setUsedRemote(true);
    } else {
      setImgError(true);
    }
  };

  const red = '#E30613';

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, verticalAlign: 'middle' }}>
      {!imgError ? (
        <Box
          component="img"
          src={currentSrc}
          alt="Stiftung Universität Hildesheim Logo"
          onError={handleError}
          sx={{
            width: size,
            height: size,
            objectFit: 'contain',
            flexShrink: 0,
            display: 'block',
            transition: 'opacity 0.2s ease',
          }}
        />
      ) : (
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
            <path id="uniHildesheimTopArc" d="M 12,62 A 48,48 0 1,1 108,62" fill="none" />
            <path id="uniHildesheimBottomArc" d="M 28,74 A 46,46 0 0,0 92,74" fill="none" />
          </defs>
          <text
            fill={color || (isDark ? '#ffffff' : '#111827')}
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
            fill={color || (isDark ? '#ffffff' : '#111827')}
            fontSize="9.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            letterSpacing="0.5px"
          >
            <textPath href="#uniHildesheimBottomArc" startOffset="50%" textAnchor="middle">
              2003
            </textPath>
          </text>
          <g id="emblem-bars">
            <polygon points="38,36 48,36 48,56 38,60" fill={isDark ? '#ffffff' : red} />
            <polygon points="38,67 48,63 48,82 38,82" fill={isDark ? '#ffffff' : red} />
            <polygon points="55,36 65,36 65,49 55,53" fill={isDark ? '#ffffff' : red} />
            <polygon points="55,60 65,56 65,82 55,82" fill={isDark ? '#ffffff' : red} />
            <polygon points="72,36 82,36 82,42 72,46" fill={isDark ? '#ffffff' : red} />
            <polygon points="72,53 82,49 82,82 72,82" fill={isDark ? '#ffffff' : red} />
          </g>
        </svg>
      )}

      {showText && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: 'text.primary',
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
