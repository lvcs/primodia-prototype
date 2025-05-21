# Replacing Relative Imports with Aliases

Based on the aliases defined in `vite.config.js`:

```javascript
alias: {
  '@': path.resolve(__dirname, './src'),
  '@assets': path.resolve(__dirname, './src/assets'),
  '@components': path.resolve(__dirname, './src/components'),
  '@config': path.resolve(__dirname, './src/config'),
  '@game': path.resolve(__dirname, './src/game'),
  '@hooks': path.resolve(__dirname, './src/hooks'),
  '@pages': path.resolve(__dirname, './src/pages'),
  '@stores': path.resolve(__dirname, './src/stores'),
  '@styles': path.resolve(__dirname, './src/styles'),
  '@utils': path.resolve(__dirname, './src/utils'),
}
```

## Examples of Replacements

### Example 1: GamePage.jsx

**Before:**
```javascript
import UnifiedControlPanel from '../components/control-panel/UnifiedControlPanel';
import UserInfo from '../components/layout/UserInfo';
import TopBar from '../components/layout/TopBar';
import MiniMap from '../components/layout/MiniMap';
import { initGame } from '../game/game';
import { useAuthStore } from '../stores';
```

**After:**
```javascript
import UnifiedControlPanel from '@components/control-panel/UnifiedControlPanel';
import UserInfo from '@components/layout/UserInfo';
import TopBar from '@components/layout/TopBar';
import MiniMap from '@components/layout/MiniMap';
import { initGame } from '@game/game';
import { useAuthStore } from '@stores';
```

### Example 2: CameraTab.jsx (with multiple levels of relative paths)

**Before:**
```javascript
import { useCameraUIStore, useWorldSettingsStore } from '../../../stores';
import { ControlSectionWrapper } from '../../ui/ControlSectionWrapper';
import { Slider } from '../../ui/Slider';
```

**After:**
```javascript
import { useCameraUIStore, useWorldSettingsStore } from '@stores';
import { ControlSectionWrapper } from '@components/ui/ControlSectionWrapper';
import { Slider } from '@components/ui/Slider';
```

### Example 3: Game Files

**Before:**
```javascript
import * as Const from '../../config/gameConstants.js';
import { getActionForKey, Actions } from '../../config/keybindings.js';
import SeedableRandom from '../../utils/SeedableRandom.js';
```

**After:**
```javascript
import * as Const from '@config/gameConstants.js';
import { getActionForKey, Actions } from '@config/keybindings.js';
import SeedableRandom from '@utils/SeedableRandom.js';
```

### Example 4: Deep Imports from Game Directory

**Before:**
```javascript
import { debug } from '../utils/debug.js';
import RandomService from '../core/RandomService.js';
```

**After:**
```javascript
import { debug } from '@game/utils/debug.js';
import RandomService from '@game/core/RandomService.js';
```

## Implementation Process

To replace all relative imports with aliased ones:

1. For one-level up imports (`../directory/file`):
   - Replace with the appropriate alias: `@alias/directory/file`

2. For multi-level up imports (`../../directory/file` or `../../../directory/file`):
   - Identify the root directory from the alias list
   - Replace with: `@rootAlias/restOfPath`

3. For imports within the same feature folder:
   - If staying within the same feature but going up and then down different branches, use appropriate alias instead

Always use the highest-level alias that applies to keep imports as concise as possible. 