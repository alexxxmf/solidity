import { QueryResolvers } from "../generated/types";

export const helloResolver: QueryResolvers["hello"] = (): string => {
  return "Hello, World!!";
};
