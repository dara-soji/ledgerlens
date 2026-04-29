export const getFileExt = (fileName: string) => {
  return fileName?.split(".")?.pop()?.toLowerCase();
};

export const truncateFileName = (name: string, maxLength: number = 30) => {
  if (!name || typeof name !== "string") return "Unknown file";
  if (name.length <= maxLength) return name;
  const extension = name.split(".").pop();
  const nameWithoutExt = name.substring(0, name.lastIndexOf("."));
  const truncatedName = nameWithoutExt.substring(
    0,
    maxLength - extension!.length - 4
  );
  return `${truncatedName}...${extension}`;
};

export const getDisplayFileName = (file?: any, job?: any): string => {
  return (
    file?.originalFileName || file?.name || job?.fileName || "Unknown file"
  );
};
