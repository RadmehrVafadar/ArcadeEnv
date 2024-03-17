import './style.css'
import {arcadeEnvironmentThree } from './arcadeEnv.js'
import { gameScreen } from './gameCanvas.js'

arcadeEnvironmentThree(document.querySelector('#bg'))
gameScreen(document.querySelector('#gameScreen'))
