import { redis } from "$lib/server/redis";
import type { PageServerLoad } from "./$types";
import { ReplacePlaceholders } from "$lib/index";
import { redirect } from "@sveltejs/kit";

const ddragonLatestURI = "https://ddragon.leagueoflegends.com/api/versions.json";
const ddragonChampionsURI = "https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json";
const ddragonPicsURI = "https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{character}.png";

const genshinCharactersURI = "https://genshin.jmp.blue/characters";
const genshinPicsURI = "https://genshin.jmp.blue/characters/{character}/icon-big";

export const ssr = false;

export const load: PageServerLoad = async (event) => {
  let title = " Memory";
  let characters: string[];
  let picsURI: string;
  switch (event.params.game) {
    case "lol":
      title = "League of Legends" + title;
      const [latestDdragon, changed] = await getLatestLol();
      characters = await getCharactersLol(latestDdragon, changed);
      picsURI = ReplacePlaceholders(ddragonPicsURI, { version: latestDdragon });
      break;
    case "genshin":
      title = "Genshin Impact" + title;
      characters = await getCharactersGenshin();
      picsURI = genshinPicsURI;
      break;
    default:
      redirect(302, "/");
  }

  return { characters, picsURI, title };
};

async function getLatestLol(): Promise<[string, boolean]> {
  const cached = await redis.get("latest-ddragon");
  if (cached) {
    return [cached, false];
  }
  const latestPermanent = await redis.get("latest-ddragon-perma");
  const res = await fetch(ddragonLatestURI);
  const latest = (await res.json())[0];
  redis.set("latest-ddragon", latest, "EX", 7200);
  if (latest != latestPermanent) {
    redis.set("latest-ddragon-perma", latest);
    return [latest, true];
  }
  return [latest, false];
}

async function getCharactersLol(latest: string, changed: boolean): Promise<string[]> {
  if (!changed) {
    const cached = await redis.get("lol-champions");
    if (cached) return JSON.parse(cached);
  }
  const res = await fetch(ReplacePlaceholders(ddragonChampionsURI, { version: latest }));
  const resJson = (await res.json()).data;
  const champions = Object.values(resJson).map((el: any) => {
    return el.id;
  });
  redis.set("lol-champions", JSON.stringify(champions));
  return champions;
}

async function getCharactersGenshin(): Promise<string[]> {
  const cached = await redis.get("genshin-characters");
  if (cached) return JSON.parse(cached);
  const res = await fetch(genshinCharactersURI);
  const characters = (await res.json()).filter((character: any) => !character.includes("traveler"));
  redis.set("genshin-characters", JSON.stringify(characters), "EX", 7200);
  return characters;
}
