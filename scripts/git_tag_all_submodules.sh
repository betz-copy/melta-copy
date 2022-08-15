#!/bin/bash

echo -n "Please enter a tag name: "
read tag_name
echo -n "Please enter a tag message: "
read tag_message

if [ -z $tag_name ];
then
    echo "Tag name can not be empty"
    exit 1
fi

echo "tagging all submodules with tag: $tag_name"
git submodule foreach git tag -a $tag_name -m "$tag_message"
git submodule foreach git push --tags
