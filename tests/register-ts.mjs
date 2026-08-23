// Registra il risolutore prima di caricare i test.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-resolver.mjs", pathToFileURL(`${import.meta.dirname}/`));
