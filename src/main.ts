import { type LumenHost, LumenPlugin } from "@lumen-media/module-sdk";
import { setupI18n, t } from "./i18n.js";

export default class CountdownModuloPlugin extends LumenPlugin {
  async onload(host: LumenHost): Promise<void> {
    setupI18n(host.app.locale);

    host.commands.add({
      id: "countdown-modulo.hello",
      title: "countdown-modulo: hello",
      run: () => host.ui.notify({ message: t("hello") }),
    });
  }
}
