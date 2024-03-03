import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectProps } from "@radix-ui/react-select";

export default function SourceSelect({ value, onValueChange }: SelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Bruvi" />
      </SelectTrigger>
      <SelectContent>
        {/* <SelectItem value="assistant/openai">OpenAI</SelectItem> */}
        <SelectItem value="assistant/tiny_llama_1b">Tiny LLAMA</SelectItem>
        <SelectItem value="assistant/bruvi">Bruvi</SelectItem>
        <SelectItem value="assistant/human">Human</SelectItem>
        <SelectItem value="null">NULL</SelectItem>
      </SelectContent>
    </Select>
  );
}
