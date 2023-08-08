import './App.css';
import {useEffect, useState} from 'react';

import {useErrors} from '../hooks/useErrors';
import {useUser} from '../hooks/useUser';
import {useUserIndex} from '../hooks/useUserIndex';
import {useTileTypes} from '../hooks/useTileTypes';
import {useCoords} from '../hooks/useCoords';
import {useWorld} from '../hooks/useWorld';
import {useLocationHash} from '../hooks/useLocationHash';
import {setCursor, useCursors} from '../hooks/useCursors';

import {Pane} from './common/Pane';
import {makeButtons} from '../utils/makeButtons';

import {ErrorBanner} from './ErrorBanner';
import {Login} from './Login';
import {Toolbar} from './Toolbar';
import {WorldEditor} from './WorldEditor';
import {Nav} from './Nav';
import {TileTypeEditor} from './TileTypeEditor';
import {GameConfig} from './GameConfig';
import {HereNow} from './HereNow';
import {MyWorlds} from './MyWorlds';
import {Stats} from './Stats';
import {defaultWorldId} from '../firebase';
import {TileLogic} from './TileLogic';
import {mergeDeepLeft} from '../utils/mergeDeepLeft';
import {defaultTileTypes} from '../defaults';

const zoomAmt = 2;

const paneConfigs = [
  {
    key: 'instructions',
    buttonLabel: 'Instructions',
    paneLabel: 'Instructions',
    icon: 'circle-question',
  },
  {
    key: 'gameConfig',
    buttonLabel: 'World Config',
    paneLabel: 'Config Overrides',
    icon: 'toolbox',
  },
  {
    key: 'tileTypeEditor',
    buttonLabel: 'Tile Config',
    paneLabel: 'Tile Config Overrides',
    icon: 'gear',
  },
  {
    key: 'hereNow',
    buttonLabel: 'People',
    paneLabel: 'Editing Now',
    icon: 'person',
  },
  {
    key: 'stats',
    buttonLabel: 'World Stats',
    paneLabel: 'World Stats',
    icon: 'gauge',
  },
  {
    key: 'myWorlds',
    buttonLabel: 'Worlds',
    paneLabel: 'Worlds',
    icon: 'earth-americas',
  },
];

export const App = () => {
  const [errors, onError, clearError] = useErrors();

  // local state
  const [worldId, setWorldId] = useState(defaultWorldId);
  const [selectedTileTypeId, setSelectedTileTypeId] = useState();
  const {xCoord, yCoord, setXCoord, setYCoord} = useCoords(0, 0);
  const [scale, setScale] = useState(32);
  const [tileLogicCoords, setTileLogicCoords] = useState();

  // firebase state
  const user = useUser();
  const userIndex = useUserIndex(user, onError);
  const tileTypes = useTileTypes(onError, worldId);
  const world = useWorld(onError, worldId);
  const cursors = useCursors(onError, worldId);

  // pane toggles
  const Panes = makeButtons(paneConfigs);

  useLocationHash({
    worldId,
    xCoord,
    yCoord,
    scale,
    setWorldId,
    setXCoord,
    setYCoord,
    setScale,
  });

  useEffect(() => {
    if (user)
      setCursor(user, null, null, worldId, xCoord, yCoord, scale, onError);
  }, [user, worldId, xCoord, yCoord, scale]);

  const mergedTileTypes = mergeDeepLeft(tileTypes, defaultTileTypes);

  return (
    <>
      <Nav {...{user, scale, setScale, zoomAmt, userIndex}}>
        {Object.values(Panes).map(({button}) => button)}
      </Nav>

      <ErrorBanner errors={errors} clearError={clearError} />

      {user ? (
        <div className="appContainer">
          {Panes.tileTypeEditor.show && (
            <Pane {...Panes.tileTypeEditor.paneProps}>
              <TileTypeEditor
                selectedTileTypeId={selectedTileTypeId}
                tileTypes={mergedTileTypes}
                worldId={worldId}
                onError={onError}
              />
            </Pane>
          )}

          {Panes.gameConfig.show && (
            <Pane {...Panes.gameConfig.paneProps}>
              <GameConfig worldId={worldId} onError={onError} />
            </Pane>
          )}

          {worldId && Panes.hereNow.show && (
            <Pane {...Panes.hereNow.paneProps}>
              <HereNow
                cursors={cursors}
                userIndex={userIndex}
                worldId={worldId}
              />
            </Pane>
          )}

          {Panes.instructions.show && (
            <Pane {...Panes.instructions.paneProps}>
              <p>Use the arrow keys or WASD to move around the map.</p>
              <p>
                Click a tile type at the bottom. Click on the map to place it.
              </p>
              <p>Shift+Click a tile to delete it.</p>
              <p>
                You can zoom in and out with{' '}
                <i className="fa-solid fa-magnifying-glass-plus"></i> and{' '}
                <i className="fa-solid fa-magnifying-glass-minus"></i> in the
                upper right.
              </p>
              <p>
                Share your URL with other editors to show them what you made.
              </p>
              <p>
                To test what you have made, Alt+Click where you want to start
                testing. Share your game URL to share your starting point.
              </p>
              <p>
                Using the None tile-type, double-click on a placed tile to open
                the script editor.
              </p>
            </Pane>
          )}

          {Panes.myWorlds.show && (
            <Pane {...Panes.myWorlds.paneProps}>
              <MyWorlds
                userIndex={userIndex}
                close={() => Panes.myWorlds.setShow(false)}
              />
            </Pane>
          )}

          {Panes.stats.show && (
            <Pane {...Panes.stats.paneProps}>
              <Stats
                world={world}
                tileTypes={mergedTileTypes}
                userIndex={userIndex}
              />
            </Pane>
          )}

          {tileLogicCoords && (
            <Pane
              label={`Tile Logic (${tileLogicCoords.x},${tileLogicCoords.y})`}
              className="tileLogicContainer"
              hide={() => setTileLogicCoords()}
            >
              <TileLogic
                tile={world[`${tileLogicCoords.x}_${tileLogicCoords.y}`]}
                {...{worldId, onError}}
              />
            </Pane>
          )}

          {
            <div className="toolContainer">
              <Toolbar
                {...{
                  tileTypes: mergedTileTypes,
                  selectedTileTypeId,
                  setSelectedTileTypeId,
                  showTileTypeEditor: Panes.tileTypeEditor.show,
                  setShowTileTypeEditor: Panes.tileTypeEditor.setShow,
                  worldId,
                }}
              />
            </div>
          }

          {worldId && (
            <div className="worldEditorContainer">
              <WorldEditor
                {...{
                  world,
                  selectedTileTypeId,
                  tileTypes: mergedTileTypes,
                  onError,
                  worldId,
                  xCoord,
                  yCoord,
                  scale,
                  user,
                  cursors,
                  userIndex,
                  tileLogicCoords,
                  setTileLogicCoords,
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <Login onError={onError} />
      )}
    </>
  );
};
