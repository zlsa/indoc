#!/bin/bash

rm -rf docs || exit 0;
mkdir docs;

node ./bin/main.js --config config.json

