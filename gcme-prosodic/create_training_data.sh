#! /bin/sh

# Create a copy of data directory while adding new tags.

datadir=$1
traindir=$2

# Create a copy of the data heirarchy without the .cat files.
cp -r $datadir $traindir
find $traindir -name '*.cat' -delete

# Update the training data with new tags

files=$(find ${datadir} -type f -name '*.cat' -exec realpath --relative-to ${datadir} {} \;)

for file in $files
do
    python2 add_tags.py ${datadir}/${file}  ${traindir}/${file}
done
