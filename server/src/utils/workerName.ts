export const WORKER_SCRIPT_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeWorkerScriptName = (name: string): string => {
  return name.trim();
};

export const isValidWorkerScriptName = (name: string): boolean => {
  return WORKER_SCRIPT_NAME_REGEX.test(normalizeWorkerScriptName(name));
};
