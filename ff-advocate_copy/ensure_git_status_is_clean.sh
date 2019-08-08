if [ -n "$(git status --porcelain)" ]; then
  echo "There are libraries that need to be linked. Please run react-native link locally.";
  exit 1
else
  echo "Everything is properly linked";
fi
