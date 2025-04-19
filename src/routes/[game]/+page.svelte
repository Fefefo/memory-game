<script lang="ts">
  import { AlertDialog, Button } from "bits-ui";
  import { ReplacePlaceholders } from "$lib/index";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  let { data } = $props();

  let flippable = true;

  let currEls: [string, HTMLElement][] = $state([]);
  let completedEls: HTMLElement[] = $state([]);

  let width = $state(4);
  let max = $derived(width * width);
  let characters: string[] = $state([]);
  let ready = $state(false);
  let dialogOpen = $state(false);
  let startTime: number | undefined;
  let boardKey: number = $state(0);
  let elapsed: number = $state(0);
  let bestElapsed: number = $state(0);

  initBoard();

  function initBoard() {
    characters = data.characters.sort(() => Math.random() - 0.5).slice(0, max / 2);
    characters = [...characters, ...characters];
    characters = characters.sort(() => Math.random() - 0.5);
    currEls = [];
    completedEls = [];
    startTime = undefined;
    dialogOpen = false;

    boardKey += 1;
    ready = true;
  }

  function flipCard(event: MouseEvent) {
    startTime = startTime ?? Date.now();
    if (!flippable) return;
    const el = <HTMLElement>event.currentTarget;
    if ((currEls.length == 1 && currEls[0].includes(el)) || el.classList.contains("rotate-y-180")) return;
    currEls.push([el.dataset.name!, el]);
    el.classList.add("rotate-y-180");
    if (currEls.length == 2) {
      if (currEls[0][0] == currEls[1][0]) {
        completedEls.push(currEls[0][1], currEls[1][1]);
        flippable = true;
        if (completedEls.length == max) {
          win();
        }
      } else {
        const els = currEls;
        setTimeout(() => {
          els[0][1].classList.remove("rotate-y-180");
          els[1][1].classList.remove("rotate-y-180");
          flippable = true;
        }, 500);
        flippable = false;
      }
      currEls = [];
    }
  }

  function prettifyTime(elapsed: number): string {
    const minElapsed = Math.floor(elapsed / 60);
    const secElapsed = elapsed % 60;
    return minElapsed > 0 ? `${minElapsed}m ${secElapsed}s` : `${secElapsed} seconds`;
  }

  function win() {
    elapsed = Math.floor((Date.now() - startTime!) / 1000);
    const currBest = localStorage.getItem(`best-${max}`);
    if (!currBest || elapsed < (bestElapsed = parseInt(currBest || "NaN", 10))) {
      bestElapsed = elapsed;
      localStorage.setItem(`best-${page.params.game}-${max}`, elapsed.toString());
    }
    setTimeout(() => (dialogOpen = true), 500);
  }

  function changePairsNum(event: Event) {
    ready = false;
    width = parseInt((event.target as HTMLInputElement).value);
    initBoard();
  }

  function swapGame() {
    const togo = page.params.game == "lol" ? "/genshin" : page.params.game == "genshin" ? "/lol" : "/";
    goto(togo).then(() => {
      initBoard();
    });
    ready = false;
  }
</script>

<svelte:head>
  <title>{data.title}</title>
</svelte:head>

<AlertDialog.Root bind:open={dialogOpen}>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="fixed inset-0 z-50 bg-black/80" />
    <AlertDialog.Content
      class="motion-preset-fade-md bg-primary fixed top-[50%] left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col items-center gap-4 rounded-md border-2 border-indigo-300 p-7 text-white outline-hidden sm:max-w-lg md:w-full"
    >
      <AlertDialog.Title class="text-2xl">Congratulations</AlertDialog.Title>
      <AlertDialog.Description class="text-offwhite text-center">
        <p>You won in {prettifyTime(elapsed)}!</p>
        <p>Your record with {max / 2} pairs is {prettifyTime(bestElapsed)}!</p>
      </AlertDialog.Description>
      <AlertDialog.Action
        class="hover:motion-preset-shake w-1/2 cursor-pointer rounded bg-blue-600/35 px-4 py-3 font-bold shadow-md"
        onclick={initBoard}>Play again!</AlertDialog.Action
      >
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

<div class="bg-board sm:bg-surface min-h-screen overflow-hidden select-none">
  <main class="bg-board mx-auto my-5 flex max-w-5xl flex-col rounded-3xl p-8 text-center align-middle text-white">
    <section class="flex flex-col items-center">
      <h3 class="mb-4 text-center text-2xl font-bold text-amber-300">
        {data.title}
      </h3>
      <input
        class="accent-emerald-300"
        id="width-slider"
        type="range"
        min="4"
        step="2"
        max="8"
        value={width}
        onchange={changePairsNum}
      />
      <label for="width-slider">{max / 2} pairs</label>
    </section>

    <section class="my-6">
      {#if ready}
        <div
          class="grid place-content-center justify-items-center gap-10"
          style="grid-template-columns: repeat({width}, minmax(0, 1fr)"
        >
          {#key boardKey}
            {#each characters as character}
              <div
                class="relative {width == 8
                  ? 'h-10 w-10'
                  : width == 6
                    ? 'h-12 w-12'
                    : 'h-16 w-16'} cursor-pointer sm:h-16 sm:w-16"
              >
                <button
                  class="flex h-full w-full cursor-pointer rounded duration-500 transform-3d"
                  onmouseup={flipCard}
                  data-name={character}
                >
                  <div
                    class="align-items bg-tertiary absolute box-border flex h-full w-full justify-center rounded-xl border-2 border-emerald-200 shadow-sm backface-hidden"
                  ></div>
                  <div
                    class="absolute box-border flex h-full w-full rotate-y-180 justify-center rounded-xl border-2 border-amber-200 backface-hidden"
                  >
                    <img class="rounded-xl" src={ReplacePlaceholders(data.picsURI, { character })} alt="" />
                  </div>
                </button>
              </div>
            {/each}
          {/key}
        </div>
      {/if}
    </section>
    <section>
      <Button.Root
        class="hover:motion-preset-shake bg-primary mt-5 cursor-pointer rounded-xl px-8 py-3 font-bold shadow-md sm:px-12 sm:text-lg"
        onclick={swapGame}
      >
        SWAP GAME
      </Button.Root>
    </section>
  </main>
</div>
