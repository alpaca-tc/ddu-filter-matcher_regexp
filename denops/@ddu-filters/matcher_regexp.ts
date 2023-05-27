import {
  BaseFilter,
  DduItem,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v2.0.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v2.0.0/deps.ts";

type Params = {
  highlightMatched: string;
  nevativeRegexpPrefix: string;
  limit: number;
};

function charposToBytepos(input: string, pos: number): number {
  return (new TextEncoder()).encode(input.slice(0, pos)).length;
}

export class Filter extends BaseFilter<Params> {
  override async filter(args: {
    denops: Denops;
    sourceOptions: SourceOptions;
    filterParams: Params;
    input: string;
    items: DduItem[];
  }): Promise<DduItem[]> {
    if (args.input == "") {
      return Promise.resolve(args.items);
    }

    const input = args.input;

    let items = args.items;

    // Split input for matchers
    const flag = args.sourceOptions.ignoreCase ? "ig" : "g";
    const inputs = input.split(/(?<!\\)\s+/).filter((x) => x != "").map((x) =>
      x.replaceAll(/\\(?=\s)/g, "")
    );
    const patterns: RegExp[] = [];
    const negativePatterns: RegExp[] = [];

    for (const input of inputs) {
      try {
        if (
          args.filterParams.nevativeRegexpPrefix &&
          input.startsWith(args.filterParams.nevativeRegexpPrefix)
        ) {
          const withoutPrefix = input.substring(
            args.filterParams.nevativeRegexpPrefix.length,
          );

          if (withoutPrefix.length > 0) {
            negativePatterns.push(new RegExp(withoutPrefix, flag));
          }
        } else {
          patterns.push(new RegExp(input, flag));
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          await args.denops.call(
            "ddu#util#print_error",
            "Invalid regular expression",
          );
        } else {
          throw e;
        }
      }
    }

    const limit = args.filterParams.limit;
    const filtered = [];
    let filteredLen = 0;

    for (const item of items) {
      // reset lastIndex
      patterns.forEach((x) => x.lastIndex = 0);
      negativePatterns.forEach((x) => x.lastIndex = 0);

      const notMatched = negativePatterns.every((pattern) =>
        !pattern.test(item.matcherKey)
      );

      const matched = notMatched &&
        patterns.every((pattern) => pattern.test(item.matcherKey));

      if (matched) {
        filtered.push(item);
        filteredLen++;

        if (filteredLen >= limit) {
          break;
        }
      }
    }

    items = filtered;

    if (args.filterParams.highlightMatched == "") {
      return Promise.resolve(items);
    }

    return Promise.resolve(
      items.map((item) => {
        const highlights = item.highlights?.filter((hl) =>
          hl.name != "matched"
        ) ?? [];
        const display = item.display ?? item.word;

        // reset lastIndex
        patterns.forEach((x) => x.lastIndex = 0);

        for (const pattern of patterns) {
          [...display.matchAll(pattern)].forEach((match) => {
            if (match.index) {
              highlights.push({
                name: "matched",
                "hl_group": args.filterParams.highlightMatched,
                col: charposToBytepos(display, match.index) + 1,
                width: (new TextEncoder()).encode(match[0]).length,
              });
            }
          });
        }

        return ({
          ...item,
          highlights: highlights,
        });
      }),
    );
  }

  override params(): Params {
    return {
      highlightMatched: "",
      nevativeRegexpPrefix: "!",
      limit: 1000,
    };
  }
}
