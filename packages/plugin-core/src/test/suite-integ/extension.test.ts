import { FileTestUtils } from "@dendronhq/common-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, before, beforeEach, describe } from "mocha";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { _activate } from "../../extension";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { Settings } from "../../settings";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import path from "path";
import { WORKSPACE_STATE } from "../../constants";

function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _.get(_settings, _key);
    },
    update: async (_key: string, _value: any) => {
      _.set(_settings, _key, _value);
    },
    has: (key: string) => {
      return _.has(_settings, key);
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

suite("startup", function () {
  const timeout = 60 * 1000;
  let root: string;
  let ctx: vscode.ExtensionContext;

  before(async function () {
    console.log("set version");
    ctx = VSCodeUtils.getOrCreateMockContext();
    // setup commands
    new DendronWorkspace(ctx);
    // .globalState.update(
    //   GLOBAL_STATE.VERSION,
    //   "0.0.1"
    // );
  });

  beforeEach(function () {
    console.log("before");
    root = FileTestUtils.tmpDir("/tmp/dendron", true);
    ctx = VSCodeUtils.getOrCreateMockContext();
  });

  afterEach(function () {
    console.log("after");
    HistoryService.instance().clearSubscriptions();
    fs.removeSync(root);
  });

  describe("sanity", function () {
    vscode.window.showInformationMessage("Start sanity test.");
    this.timeout(timeout);

    test("workspace not activated", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: {}
        });
      };
      _activate(ctx);
      // const ws = DendronWorkspace.instance();
      // ws.reloadWorkspace(root)
      HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), false);
        done();
      });
    });

    test("workspace active, no prior workspace version", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: {rootDir: root}
        });
      };
      DendronWorkspace.workspaceFile = () => {
        return vscode.Uri.file(path.join(root, "dendron.code-workspace"));
      }
      DendronWorkspace.workspaceFolders = () => {
        const uri = vscode.Uri.file(path.join(root, "vault.main"));
        return [{uri, name: "vault.main", index: 0}]
      }
      DendronWorkspace.instance().setupWorkspace(root, {skipOpenWS: true}).then(()=> {
        _activate(ctx);
      });
      HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        done();
      });
    });

    test("workspace active, prior workspace version", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: {rootDir: root}
        });
      };
      DendronWorkspace.workspaceFile = () => {
        return vscode.Uri.file(path.join(root, "dendron.code-workspace"));
      }
      DendronWorkspace.workspaceFolders = () => {
        const uri = vscode.Uri.file(path.join(root, "vault.main"));
        return [{uri, name: "vault.main", index: 0}]
      }
      ctx.workspaceState.update(WORKSPACE_STATE.WS_VERSION, "0.0.1").then(()=> {
        DendronWorkspace.instance().setupWorkspace(root, {skipOpenWS: true}).then(()=> {
          _activate(ctx);
        });
      });
      HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        assert.equal(ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION), VSCodeUtils.getVersionFromPkg());
        done();
      });
    });

    // test("upgrade from existing", function (done) {
    //   vscode.window.showInformationMessage("waiting for existing");
    //   ws = DendronWorkspace.instance();
    //   HistoryService.instance().subscribe(
    //     "extension",
    //     async (_event: HistoryEvent) => {
    //       vscode.window.showInformationMessage(`got activate`);
    //       ws = DendronWorkspace.instance();
    //       await ws.setupWorkspace(root, { skipOpenWS: true });
    //       await ws.reloadWorkspace(root);
    //       vscode.window.showInformationMessage(`setup ws`);
    //       assert.ok("done");
    //       done();
    //     }
    //   );
    // });
  });
});

// suite("existing install", function () {
//   const timeout = 60 * 1000;
//   let root: string;
//   let ws: DendronWorkspace;

//   beforeEach(async function () {
//     root = FileTestUtils.tmpDir("/tmp/dendron", true);
//   });

//   afterEach(async () => {
//     fs.removeSync(root);
//   });

//   describe("sanity", function () {
//     vscode.window.showInformationMessage("Start sanity test on new.");
//     this.timeout(timeout);

//     test("new install", function (done) {
//       vscode.window.showInformationMessage("waiting");
//       HistoryService.instance().subscribe("extension", async (event: HistoryEvent) => {
//         vscode.window.showInformationMessage(`got activate`);
//         ws = DendronWorkspace.instance();
//         await ws.setupWorkspace(root, {skipOpenWS: true});
//         await ws.reloadWorkspace(root);
//         vscode.window.showInformationMessage(`setup ws`);
//         assert.ok("done");
//         done();
//       });
//     });
//   });
// });

// suite("Extension Test Suite", function () {
//   let root: string;
//   let actualFiles: string[];
//   let expectedFiles: string[];
//   let ws: DendronWorkspace;

//   beforeEach(async function () {
//     root = FileTestUtils.tmpDir("/tmp/dendron", true);

//     const ctx = createMockContext(root);

//     ws = new DendronWorkspace(ctx, { skipSetup: true });
//     await ws.setupWorkspace(root, { skipOpenWS: true });

//     // setup configWS
//     const wsFolder = VSCodeUtils.createWSFolder(path.join(root, "vault.main"));
//     ws.configWS = vscode.workspace.getConfiguration(undefined, wsFolder);

//     const fixtures = LernaTestUtils.getFixturesDir();
//     const storeDir = path.join(fixtures, "store");
//     console.log(storeDir);
//     fs.copySync(storeDir, root);
//     console.log(root);
//     return;
//   });

//   afterEach(async () => {
//     assert.deepEqual(actualFiles, expectedFiles);
//     fs.removeSync(root);
//   });

//   describe("settings", () => {
//     test("defaults", () => {
//       assert.deepStrictEqual(Settings.defaults({ rootDir: "bond" }), {
//         "dendron.rootDir": "bond",
//         "editor.minimap.enabled": false,
//         "files.autoSave": "onFocusChange",
//         "markdown-preview-enhanced.enableWikiLinkSyntax": true,
//         "materialTheme.accent": "Red",
//         "pasteImage.path": "${currentFileDir}/assets",
//         "spellright.documentTypes": ["markdown", "latex", "plaintext"],
//         "spellright.language": ["en"],
//         "vscodeMarkdownNotes.slugifyCharacter": "NONE",
//         "workbench.colorTheme": "Material Theme High Contrast",
//       });
//     });

//     test.skip("upgrade", async function () {
//       const bond = {
//         "bond.config": {
//           default: 42,
//         },
//       };
//       const changed = await Settings.upgrade(
//         ws.configWS as vscode.WorkspaceConfiguration,
//         bond
//       );
//       assert.deepStrictEqual(changed, { add: { "bond.config": 42 } });
//     });
//   });

//   describe("file system", () => {
//     test("new file", () => {
//       assert.ok(true);
//       [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
//         root,
//         LernaTestUtils.fixtureFilesForStore()
//       );
//     });
//   });

//   describe("workspace", () => {
//     test("sanity", async () => {
//       const workspace = fs.readJsonSync(
//         path.join(root, "dendron.code-workspace")
//       );
//       assert.deepStrictEqual(
//         workspace["settings"],
//         Settings.defaults({ rootDir: root })
//       );
//     });

//     test("reload", async () => {
//       await ws.reloadWorkspace(root);
//       assert.equal(ws.engine.notes["root"].children.length, 1);
//       const { content, data } = FileTestUtils.readMDFile(root, "foo.one.md");
//       assert.equal(_.trim(content), "");
//       const actual = testUtils.omitEntropicProps(data as NoteRawProps, true);
//       assert.deepEqual(actual, {
//         custom: {
//           bond: 42,
//         },
//         id: "foo.one",
//         title: "foo.one",
//       });
//       // stub node should not be written to disk
//       [expectedFiles, actualFiles] = VSFileUtils.cmpFiles(
//         root,
//         LernaTestUtils.fixtureFilesForStore()
//       );
//     });
//   });
// });
