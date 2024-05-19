// @ts-check

export default class Mat4 {
  static identity() {
    return new Mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  static multiply(/** @type {Mat4} */ a, /** @type {Mat4} */ b) {
    return new Mat4(
      a.r0c0 * b.r0c0 + a.r0c1 * b.r1c0 + a.r0c2 * b.r2c0 + a.r0c3 * b.r3c0,
      a.r1c0 * b.r0c0 + a.r1c1 * b.r1c0 + a.r1c2 * b.r2c0 + a.r1c3 * b.r3c0,
      a.r2c0 * b.r0c0 + a.r2c1 * b.r1c0 + a.r2c2 * b.r2c0 + a.r2c3 * b.r3c0,
      a.r3c0 * b.r0c0 + a.r3c1 * b.r1c0 + a.r3c2 * b.r2c0 + a.r3c3 * b.r3c0,
      a.r0c0 * b.r0c1 + a.r0c1 * b.r1c1 + a.r0c2 * b.r2c1 + a.r0c3 * b.r3c1,
      a.r1c0 * b.r0c1 + a.r1c1 * b.r1c1 + a.r1c2 * b.r2c1 + a.r1c3 * b.r3c1,
      a.r2c0 * b.r0c1 + a.r2c1 * b.r1c1 + a.r2c2 * b.r2c1 + a.r2c3 * b.r3c1,
      a.r3c0 * b.r0c1 + a.r3c1 * b.r1c1 + a.r3c2 * b.r2c1 + a.r3c3 * b.r3c1,
      a.r0c0 * b.r0c2 + a.r0c1 * b.r1c2 + a.r0c2 * b.r2c2 + a.r0c3 * b.r3c2,
      a.r1c0 * b.r0c2 + a.r1c1 * b.r1c2 + a.r1c2 * b.r2c2 + a.r1c3 * b.r3c2,
      a.r2c0 * b.r0c2 + a.r2c1 * b.r1c2 + a.r2c2 * b.r2c2 + a.r2c3 * b.r3c2,
      a.r3c0 * b.r0c2 + a.r3c1 * b.r1c2 + a.r3c2 * b.r2c2 + a.r3c3 * b.r3c2,
      a.r0c0 * b.r0c3 + a.r0c1 * b.r1c3 + a.r0c2 * b.r2c3 + a.r0c3 * b.r3c3,
      a.r1c0 * b.r0c3 + a.r1c1 * b.r1c3 + a.r1c2 * b.r2c3 + a.r1c3 * b.r3c3,
      a.r2c0 * b.r0c3 + a.r2c1 * b.r1c3 + a.r2c2 * b.r2c3 + a.r2c3 * b.r3c3,
      a.r3c0 * b.r0c3 + a.r3c1 * b.r1c3 + a.r3c2 * b.r2c3 + a.r3c3 * b.r3c3
    );
  }

  constructor(
    /** @type {number} */ r0c0,
    /** @type {number} */ r1c0,
    /** @type {number} */ r2c0,
    /** @type {number} */ r3c0,
    /** @type {number} */ r0c1,
    /** @type {number} */ r1c1,
    /** @type {number} */ r2c1,
    /** @type {number} */ r3c1,
    /** @type {number} */ r0c2,
    /** @type {number} */ r1c2,
    /** @type {number} */ r2c2,
    /** @type {number} */ r3c2,
    /** @type {number} */ r0c3,
    /** @type {number} */ r1c3,
    /** @type {number} */ r2c3,
    /** @type {number} */ r3c3
  ) {
    this.r0c0 = r0c0;
    this.r1c0 = r1c0;
    this.r2c0 = r2c0;
    this.r3c0 = r3c0;
    this.r0c1 = r0c1;
    this.r1c1 = r1c1;
    this.r2c1 = r2c1;
    this.r3c1 = r3c1;
    this.r0c2 = r0c2;
    this.r1c2 = r1c2;
    this.r2c2 = r2c2;
    this.r3c2 = r3c2;
    this.r0c3 = r0c3;
    this.r1c3 = r1c3;
    this.r2c3 = r2c3;
    this.r3c3 = r3c3;
  }

  scale(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) {
    const scalingMatrix = Mat4.identity();
    scalingMatrix.r0c0 = x;
    scalingMatrix.r1c1 = y;
    scalingMatrix.r2c2 = z;

    return Mat4.multiply(scalingMatrix, this);
  }

  translate(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ z) {
    const translationMatrix = Mat4.identity();
    translationMatrix.r0c3 = x;
    translationMatrix.r1c3 = y;
    translationMatrix.r2c3 = z;

    return Mat4.multiply(translationMatrix, this);
  }

  rotateX(/** @type {number} */ degrees) {
    const rotationMatrix = Mat4.identity();
    const radians = degrees * (Math.PI / 180);
    rotationMatrix.r1c1 = Math.cos(radians);
    rotationMatrix.r2c1 = -Math.sin(radians);
    rotationMatrix.r1c2 = Math.sin(radians);
    rotationMatrix.r2c2 = Math.cos(radians);

    return Mat4.multiply(rotationMatrix, this);
  }

  rotateY(/** @type {number} */ degrees) {
    const rotationMatrix = Mat4.identity();
    const radians = degrees * (Math.PI / 180);
    rotationMatrix.r0c0 = Math.cos(radians);
    rotationMatrix.r2c0 = Math.sin(radians);
    rotationMatrix.r0c2 = -Math.sin(radians);
    rotationMatrix.r2c2 = Math.cos(radians);

    return Mat4.multiply(rotationMatrix, this);
  }

  rotateZ(/** @type {number} */ degrees) {
    const rotationMatrix = Mat4.identity();
    const radians = degrees * (Math.PI / 180);
    rotationMatrix.r0c0 = Math.cos(radians);
    rotationMatrix.r1c0 = -Math.sin(radians);
    rotationMatrix.r0c1 = Math.sin(radians);
    rotationMatrix.r1c1 = Math.cos(radians);

    return Mat4.multiply(rotationMatrix, this);
  }

  orthographic(
    /** @type {number} */ top,
    /** @type {number} */ bottom,
    /** @type {number} */ left,
    /** @type {number} */ right,
    /** @type {number} */ near,
    /** @type {number} */ far
  ) {
    const projectionMatrix = Mat4.identity();
    projectionMatrix.r0c0 = 2 / (right - left);
    projectionMatrix.r1c1 = 2 / (top - bottom);
    projectionMatrix.r2c2 = 1 / (far - near);
    projectionMatrix.r0c3 = (-2 * left) / (right - left) - 1;
    projectionMatrix.r1c3 = (-2 * bottom) / (top - bottom) - 1;
    projectionMatrix.r2c3 = (-1 * near) / (far - near) - 0.5;

    return Mat4.multiply(projectionMatrix, this);
  }

  // TODO: center object using bounding box
  perspective(/** @type {number} */ near, /** @type {number} */ far) {
    const projectionMatrix = Mat4.identity();
    projectionMatrix.r0c0 = near;
    projectionMatrix.r1c1 = near;
    projectionMatrix.r2c2 = near + far;
    projectionMatrix.r2c3 = -near * far;
    projectionMatrix.r3c2 = 1;

    return Mat4.multiply(projectionMatrix, this);
  }

  toArray() {
    return [
      this.r0c0,
      this.r1c0,
      this.r2c0,
      this.r3c0,
      this.r0c1,
      this.r1c1,
      this.r2c1,
      this.r3c1,
      this.r0c2,
      this.r1c2,
      this.r2c2,
      this.r3c2,
      this.r0c3,
      this.r1c3,
      this.r2c3,
      this.r3c3,
    ];
  }

  inverse() {
    const det = (
      /** @type {number} */ row,
      /** @type {number} */ col,
      /** @type {number[]} */ mat) => {
        const subMat = mat.filter((_, index) => index % 4 !== row && Math.floor(index / 4) !== col)
        return subMat[0] * (subMat[4] * subMat[8] - subMat[7] * subMat[5]) -
              subMat[3] * (subMat[1] * subMat[8] - subMat[7] * subMat[2]) +
              subMat[6] * (subMat[1] * subMat[5] - subMat[4] * subMat[3]);
      }

    const mat = this.toArray();

    const matrixOfMinors = [
      det(0, 0, mat), det(1, 0, mat), det(2, 0, mat), det(3, 0, mat),
      det(0, 1, mat), det(1, 1, mat), det(2, 1, mat), det(3, 1, mat),
      det(0, 2, mat), det(1, 2, mat), det(2, 2, mat), det(3, 2, mat),
      det(0, 3, mat), det(1, 3, mat), det(2, 3, mat), det(3, 3, mat),
    ]

    const matrixOfCofactors = matrixOfMinors.map((value, index) => index % 1 === 1 ? -1 * value : value)

    const matrixOfAdjugate = [
      matrixOfCofactors[0], matrixOfCofactors[4], matrixOfCofactors[8], matrixOfCofactors[12],
      matrixOfCofactors[1], matrixOfCofactors[5], matrixOfCofactors[9], matrixOfCofactors[13],
      matrixOfCofactors[2], matrixOfCofactors[6], matrixOfCofactors[10], matrixOfCofactors[14],
      matrixOfCofactors[3], matrixOfCofactors[7], matrixOfCofactors[11], matrixOfCofactors[15]
    ]

    const determinant = mat[0] * matrixOfMinors[0] - mat[4] * matrixOfMinors[4] + mat[8] * matrixOfMinors[8];

    return new Mat4(
      matrixOfAdjugate[0] / determinant, matrixOfAdjugate[1] / determinant, matrixOfAdjugate[2] / determinant, matrixOfAdjugate[3] / determinant,
      matrixOfAdjugate[4] / determinant, matrixOfAdjugate[5] / determinant, matrixOfAdjugate[6] / determinant, matrixOfAdjugate[7] / determinant,
      matrixOfAdjugate[8] / determinant, matrixOfAdjugate[9] / determinant, matrixOfAdjugate[10] / determinant, matrixOfAdjugate[11] / determinant,
      matrixOfAdjugate[12] / determinant, matrixOfAdjugate[13] / determinant, matrixOfAdjugate[14] / determinant, matrixOfAdjugate[15] / determinant,
    )
  }
}
