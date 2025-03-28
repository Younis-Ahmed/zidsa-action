#!/bin/bash
# filepath: commit-licenses.sh

# Find all untracked files (excluding .gitignore entries)
untracked_files=$(git ls-files --others --exclude-standard)

# Check if there are any untracked files
if [ -z "$untracked_files" ]; then
  echo "No untracked files found."
  exit 0
fi

# Iterate through each untracked file
for file in $untracked_files; do
  # Add the file to the staging area
  git add "$file"
  
  # Create a commit with the specific message format
  git commit -m "chore: add license information for \`$file\`"
  
  echo "Committed: $file"
done

echo "All untracked files have been committed."