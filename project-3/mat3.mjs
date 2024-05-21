// @ts-check

export default class Mat3 {
    constructor(
      /** @type {number} */ r0c0,
      /** @type {number} */ r1c0,
      /** @type {number} */ r2c0,
      /** @type {number} */ r0c1,
      /** @type {number} */ r1c1,
      /** @type {number} */ r2c1,
      /** @type {number} */ r0c2,
      /** @type {number} */ r1c2,
      /** @type {number} */ r2c2,
    ) {
      this.r0c0 = r0c0;
      this.r1c0 = r1c0;
      this.r2c0 = r2c0;
      this.r0c1 = r0c1;
      this.r1c1 = r1c1;
      this.r2c1 = r2c1;
      this.r0c2 = r0c2;
      this.r1c2 = r1c2;
      this.r2c2 = r2c2;
    }
  
    toArray() {
      return [
        this.r0c0,
        this.r1c0,
        this.r2c0,
        this.r0c1,
        this.r1c1,
        this.r2c1,
        this.r0c2,
        this.r1c2,
        this.r2c2,
      ];
    }
  
    inverse() {
        const det = (
          /** @type {number} */ row,
          /** @type {number} */ col,
          /** @type {number[]} */ mat) => {
            const subMat = mat.filter((_, index) => index % 3 !== row && Math.floor(index / 3) !== col)
            return subMat[0] * subMat[3] - subMat[2] * subMat[1];
          }
    
        const mat = this.toArray();
    
        const matrixOfMinors = [
          det(0, 0, mat), det(1, 0, mat), det(2, 0, mat),
          det(0, 1, mat), det(1, 1, mat), det(2, 1, mat),
          det(0, 2, mat), det(1, 2, mat), det(2, 2, mat),
        ]
    
        const matrixOfCofactors = [
          matrixOfMinors[0], -1 * matrixOfMinors[1], matrixOfMinors[2],
          -1 * matrixOfMinors[3], matrixOfMinors[4], -1 * matrixOfMinors[5],
          matrixOfMinors[6], -1 * matrixOfMinors[7], matrixOfMinors[8],
        ]
    
        const matrixOfAdjugate = [
          matrixOfCofactors[0], matrixOfCofactors[3], matrixOfCofactors[6],
          matrixOfCofactors[1], matrixOfCofactors[4], matrixOfCofactors[7],
          matrixOfCofactors[2], matrixOfCofactors[5], matrixOfCofactors[8],
        ]
    
        const determinant = mat[0] * matrixOfMinors[0] - mat[3] * matrixOfMinors[3] + mat[6] * matrixOfMinors[6];
    
        return new Mat3(
          matrixOfAdjugate[0] / determinant, matrixOfAdjugate[1] / determinant, matrixOfAdjugate[2] / determinant,
          matrixOfAdjugate[3] / determinant, matrixOfAdjugate[4] / determinant, matrixOfAdjugate[5] / determinant,
          matrixOfAdjugate[6] / determinant, matrixOfAdjugate[7] / determinant, matrixOfAdjugate[8] / determinant,
        )
      }
  
    transpose() {
      return new Mat3(
        this.r0c0, this.r0c1, this.r0c2,
        this.r1c0, this.r1c1, this.r1c2,
        this.r2c0, this.r2c1, this.r2c2,
      )
    }
  }
  