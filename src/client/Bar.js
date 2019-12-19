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
    const old = this.valueInternal;
    this.maxValueInternal = val;
    this.updateElement(old, val);
  }

  set value(val) {
    const old = this.valueInternal;
    this.valueInternal = val;
    this.updateElement(old, val);
  }

  updateElement(oldValue, newValue) {
    if (oldValue !== newValue) {
      const width = Math.round((this.value / this.maxValue) * 100) + "%";
      if (this.label) {
        this.label.innerText =
          Math.round(this.value) + "/" + Math.round(this.maxValue);
      }
      this.element.style.width = width;
    }
  }
}

export default Bar;
