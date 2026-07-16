#!/bin/sh

# Delete intern packages folder and replace with updated version
rsync -a --delete packages/ desktop/src/packages/
rsync -a --delete packages/ mobile/packages/
rsync -a --delete packages/ web/src/packages/