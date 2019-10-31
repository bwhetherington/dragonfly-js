class Bar {
  constructor(barID, labelID, maxValue) {
    this.element = document.getElementById(barID);
    if (labelID) {
      this.label = document.getElementById(labelID);
    }
    this.maxValueInternal = maxValue;
    this.valueInternal = 1;
    this.updateElement();
  }

  get value() {
    return this.valueInternal;
  }

  get maxValue() {
    return this.maxValueInternal;
  }

  set maxValue(val) {
    this.maxValueInternal = val;
    this.updateElement();
  }

  set value(val) {
    this.valueInternal = val;
    this.updateElement();
  }

  updateElement() {
    const width = Math.round(this.value / this.maxValue * 100) + '%';
    if (this.label) {
      this.label.innerText = this.value + '/' + this.maxValue;
    }
    this.element.style.width = width;
  }
}

export default Bar;