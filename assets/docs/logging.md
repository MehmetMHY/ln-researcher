# Logging For This Project

## About:
- The NPM package 'Pino' is what this project will use as it's logger.
- All logs will be saved to a file which is configured in: config/config.json.
- The main logging function can be found at: utils/logger.js

## Sources:
- https://github.com/pinojs/pino
- https://github.com/pinojs/pino-pretty

## How To View Logs:
1. Make sure pino-pretty is installed (globally)
2. Run this command (modify the path value):
    ```
    cat <log_file_path>/lb_researcher.log | pino-pretty
    ```


