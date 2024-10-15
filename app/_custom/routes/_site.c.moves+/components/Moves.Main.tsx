import { descriptionParser } from "~/_custom/utils/descriptionParser";
import { Move } from "~/db/payload-custom-types";

export function MovesMain({ data }: { data: Move }) {
   const move = data;

   return move.desc ? (
      <div
         className="border border-color-sub bg-2-sub p-4 rounded-xl shadow-sm shadow-1"
         dangerouslySetInnerHTML={{
            __html: descriptionParser(move.desc ?? ""),
         }}
      />
   ) : null;
}
