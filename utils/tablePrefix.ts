export const getTableName = (baseName: string) => {
  return `${process.env.EXPO_PUBLIC_TABLE_PREFIX}${baseName}`;
};