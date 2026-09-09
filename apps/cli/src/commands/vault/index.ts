import { BaseCommand } from '../../base-command.js';
import { installedPath, readManifest, vaultDir, type VaultEntry } from '../../vault.js';

type InstalledEntry = VaultEntry & { name: string; path: string };

export default class Vault extends BaseCommand {
  static description = 'List deliverables installed in the local vault';

  async run(): Promise<{ dir: string; installed: InstalledEntry[] }> {
    await this.parse(Vault);
    const manifest = await readManifest();
    const names = Object.keys(manifest).sort();
    const installed = names.map((name) => ({
      name,
      ...manifest[name],
      path: installedPath(name, manifest[name]),
    }));

    if (!names.length) {
      this.log(`Vault is empty (${vaultDir()}). Install with \`fde install <name>\`.`);
    } else {
      this.log(`Vault: ${vaultDir()}`);
      for (const entry of installed) {
        this.log(
          `${entry.name.padEnd(30)}  v${String(entry.version).padEnd(3)}  ${entry.fileName.padEnd(28)}  installed ${entry.installedAt}`,
        );
      }
    }
    return { dir: vaultDir(), installed };
  }
}
