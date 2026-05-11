import { app } from 'electron';
import main from './src/desktop/launcher/index.mjs';

app.commandLine.appendSwitch('ignore-certificate-errors');

await main();
