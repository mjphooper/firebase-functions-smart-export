import { expect } from 'chai';
import { buildExportTree } from '../src/build_export_tree.js';
import type { ParsedFunction } from '../src/parse_function_files.js';

function makeFunctions(...exportKeys: string[]): ParsedFunction[] {
  return exportKeys.map(exportKey => ({ exportKey, filePath: `${exportKey}.function.js` }));
}

describe('buildExportTree()', () => {
  it('maps a top-level function to its index', () => {
    // Act
    const tree = buildExportTree(makeFunctions('hello'));

    // Assert
    expect(tree).to.deep.equal(new Map([['hello', 0]]));
  });

  it('nests a function under each of its groups', () => {
    // Act
    const tree = buildExportTree(makeFunctions('posts.https.createPost'));

    // Assert
    expect(tree).to.deep.equal(new Map([
      ['posts', new Map([['https', new Map([['createPost', 0]])]])],
    ]));
  });

  it('merges functions that share a group at any depth', () => {
    // Act
    const tree = buildExportTree(makeFunctions('chats.messages.onSend', 'chats.messages.onEdit', 'chats.onCreate'));

    // Assert
    expect(tree).to.deep.equal(new Map([
      ['chats', new Map<string, unknown>([
        ['messages', new Map([['onSend', 0], ['onEdit', 1]])],
        ['onCreate', 2],
      ])],
    ]));
  });

  it('keeps names and groups in first-seen order', () => {
    // Act
    const tree = buildExportTree(makeFunctions('posts.create', 'hello', 'posts.delete'));

    // Assert
    expect([...tree.keys()]).to.deep.equal(['posts', 'hello']);
    expect([...(tree.get('posts') as Map<string, unknown>).keys()]).to.deep.equal(['create', 'delete']);
  });

  it('handles names inherited from Object.prototype as ordinary keys', () => {
    // Act
    const tree = buildExportTree(makeFunctions('constructor.toString', 'constructor.valueOf'));

    // Assert
    expect(tree).to.deep.equal(new Map([
      ['constructor', new Map([['toString', 0], ['valueOf', 1]])],
    ]));
  });
});
