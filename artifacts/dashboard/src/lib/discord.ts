export function getGuildIconUrl(guildId: string, iconHash?: string | null) {
  if (!iconHash) return undefined;
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
}

export function getAvatarFallback(name?: string | null) {
  if (!name) return "??";
  return name.substring(0, 2).toUpperCase();
}
