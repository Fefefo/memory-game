<script lang="ts">
  import { AlertDialog } from "bits-ui";
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
  let minElapsed: number = $state(0);
  let secElapsed: number = $state(0);
  let boardKey: number = $state(0);

  initBoard();

  function initBoard() {
    characters = data.characters.sort(() => Math.random() - 0.5).slice(0, max / 2);
    characters = [...characters, ...characters];
    characters = characters.sort(() => Math.random() - 0.5);
    currEls = [];
    completedEls = [];
    startTime = undefined;
    dialogOpen = true;

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
          const elapsed = Math.floor((Date.now() - startTime!) / 1000);
          minElapsed = Math.floor(elapsed / 60);
          secElapsed = elapsed % 60;
          setTimeout(() => (dialogOpen = true), 500);
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
      class="fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-md border-2 border-[#235] bg-[#457] p-7 outline-hidden sm:max-w-lg md:w-full"
    >
      <AlertDialog.Title>Well Done!</AlertDialog.Title>
      <AlertDialog.Description
        >You win in {minElapsed > 0
          ? `${minElapsed}m ${secElapsed}s`
          : `${secElapsed} seconds`}!</AlertDialog.Description
      >
      <AlertDialog.Action onclick={initBoard}>YAAAY</AlertDialog.Action>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>

<div class="min-h-screen overflow-hidden bg-[#404258] select-none">
  <main class="mx-auto mt-5 flex max-w-5xl flex-col rounded-lg bg-[#474e68] p-8 text-center align-middle text-white">
    <section class="flex flex-col items-center">
      <h3 class="text-center text-2xl font-bold">
        {data.title}
      </h3>
      <input
        id="width-slider"
        type="range"
        min="4"
        step="2"
        max="8"
        value={width}
        onchange={(e) => {
          ready = false;
          width = parseInt(e.currentTarget.value);
          initBoard();
        }}
      />
      <label for="width-slider">{width}</label>
    </section>

    <section>
      {#if ready}
        <div
          class="grid place-content-center justify-items-center gap-10"
          style="grid-template-columns: repeat({width}, minmax(0, 1fr)"
        >
          {#key boardKey}
            {#each characters as character}
              <div
                class="card-container relative {width == 8
                  ? 'h-10 w-10'
                  : width == 6
                    ? 'h-12 w-12'
                    : 'h-[60px] w-[60px]'} sm:h-[60px] sm:w-[60px]"
              >
                <button
                  class="flex h-full w-full rounded duration-500 transform-3d"
                  onmouseup={flipCard}
                  data-name={character}
                >
                  <div
                    class="align-items absolute box-border flex h-full w-full justify-center rounded-xl border-2 border-cyan-700 bg-[#457] shadow-sm backface-hidden"
                  ></div>
                  <div
                    class="card-bg align-items absolute flex h-full w-full rotate-y-180 justify-center rounded-xl backface-hidden"
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
      <button
        class="hover:motion-preset-shake mt-5 rounded bg-[#50577a] px-4 py-3 font-bold shadow-md"
        onclick={swapGame}>SWAP GAME</button
      >
    </section>
  </main>
</div>

<!-- <style lang="postcss">
  .card-size {
    @apply h-12 w-12 sm:h-[60px] sm:w-[60px];
  }
</style> -->
