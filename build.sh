#!/bin/bash

# This script path 
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

JS_DIR=$SCRIPT_DIR
OUTPUT_DIR=$SCRIPT_DIR

# minify slidr
java -jar /usr/local/bin/compiler.jar --js $JS_DIR/swiper.js --js_output_file $OUTPUT_DIR/swiper.min.js
