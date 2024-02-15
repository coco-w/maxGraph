/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import Cell from '../view/cell/Cell';
import { Graph } from '../view/Graph';
import { getTopmostCells } from './cellArrayUtils';

/**
 * @class
 *
 * Singleton that implements a clipboard for graph cells.
 *
 * ### Example:
 *
 * ```javascript
 * Clipboard.copy(graph);
 * Clipboard.paste(graph2);
 * ```
 *
 * This copies the selection cells from the graph to the clipboard and
 * pastes them into graph2.
 *
 * For fine-grained control of the clipboard data the {@link graph.canExportCell}
 * and {@link graph.canImportCell} functions can be overridden.
 *
 * To restore previous parents for pasted cells, the implementation for
 * {@link copy} and {@link paste} can be changed as follows.
 *
 * ```javascript
 * Clipboard.copy = function(graph, cells)
 * {
 *   cells = cells || graph.getSelectionCells();
 *   var result = graph.getExportableCells(cells);
 *
 *   Clipboard.parents = new Object();
 *
 *   for (var i = 0; i < result.length; i++)
 *   {
 *     Clipboard.parents[i] = graph.model.getParent(cells[i]);
 *   }
 *
 *   Clipboard.insertCount = 1;
 *   Clipboard.setCells(graph.cloneCells(result));
 *
 *   return result;
 * };
 *
 * Clipboard.paste = function(graph)
 * {
 *   if (!Clipboard.isEmpty())
 *   {
 *     var cells = graph.getImportableCells(Clipboard.getCells());
 *     var delta = Clipboard.insertCount * Clipboard.STEPSIZE;
 *     var parent = graph.getDefaultParent();
 *
 *     graph.model.beginUpdate();
 *     try
 *     {
 *       for (var i = 0; i < cells.length; i++)
 *       {
 *         var tmp = (Clipboard.parents != null && graph.model.contains(Clipboard.parents[i])) ?
 *              Clipboard.parents[i] : parent;
 *         cells[i] = graph.importCells([cells[i]], delta, delta, tmp)[0];
 *       }
 *     }
 *     finally
 *     {
 *       graph.model.endUpdate();
 *     }
 *
 *     // Increments the counter and selects the inserted cells
 *     Clipboard.insertCount++;
 *     graph.setSelectionCells(cells);
 *   }
 * };
 * ```
 */
class Clipboard {
  /**
   * Defines the step size to offset the cells after each paste operation.
   * Default is 10.
   */
  static STEPSIZE = 10;

  /**
   * Counts the number of times the clipboard data has been inserted.
   */
  static insertCount = 1;

  /**
   * Holds the array of {@link mxCell} currently in the clipboard.
   */
  static cells: Cell[];

  /**
   * Sets the cells in the clipboard. Fires a {@link mxEvent.CHANGE} event.
   */
  static setCells(cells: Cell[]) {
    Clipboard.cells = cells;
  }

  /**
   * Returns  the cells in the clipboard.
   */
  static getCells() {
    return Clipboard.cells;
  }

  /**
   * Returns true if the clipboard currently has not data stored.
   */
  static isEmpty() {
    return !Clipboard.getCells();
  }

  /**
   * Cuts the given array of {@link mxCell} from the specified graph.
   * If cells is null then the selection cells of the graph will
   * be used. Returns the cells that have been cut from the graph.
   *
   * @param graph - {@link graph} that contains the cells to be cut.
   * @param cells - Optional array of {@link mxCell} to be cut.
   */
  static cut(graph: Graph, cells: Cell[] = []) {
    cells = Clipboard.copy(graph, cells);
    Clipboard.insertCount = 0;
    Clipboard.removeCells(graph, cells);

    return cells;
  }

  /**
   * Hook to remove the given cells from the given graph after
   * a cut operation.
   *
   * @param graph - {@link graph} that contains the cells to be cut.
   * @param cells - Array of {@link mxCell} to be cut.
   */
  static removeCells(graph: Graph, cells: Cell[]) {
    graph.removeCells(cells);
  }

  /**
   * Copies the given array of {@link mxCell} from the specified
   * graph to {@link cells}. Returns the original array of cells that has
   * been cloned. Descendants of cells in the array are ignored.
   *
   * @param graph - {@link graph} that contains the cells to be copied.
   * @param cells - Optional array of {@link mxCell} to be copied.
   */
  static copy(graph: Graph, cells?: Cell[]) {
    cells = cells || graph.getSelectionCells();
    const result = getTopmostCells(graph.getExportableCells(cells));
    Clipboard.insertCount = 1;

    Clipboard.setCells(graph.cloneCells(result));
    return result;
  }

  /**
   * Pastes the {@link cells} into the specified graph restoring
   * the relation to {@link parents}, if possible. If the parents
   * are no longer in the graph or invisible then the
   * cells are added to the graph's default or into the
   * swimlane under the cell's new location if one exists.
   * The cells are added to the graph using {@link graph.importCells}
   * and returned.
   *
   * @param graph - {@link graph} to paste the {@link cells} into.
   */
  static paste(graph: Graph) {
    let cells = null;

    if (!Clipboard.isEmpty() && Clipboard.getCells()) {
      cells = graph.getImportableCells(Clipboard.getCells());
      const delta = Clipboard.insertCount * Clipboard.STEPSIZE;
      const parent = graph.getDefaultParent();

      cells = graph.importCells(cells, delta, delta, parent);

      // Increments the counter and selects the inserted cells
      Clipboard.insertCount++;
      graph.setSelectionCells(cells);
    }

    return cells;
  }
}

export default Clipboard;
