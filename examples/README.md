# How to use

Each example in this folder consists of two files
  * oled file with the model that can be editted using [OLED](https://github.com/nemo-ufes/ontouml-lightweight-editor)
  * refontouml export of the model that can be input in the generator like this
```
npm start -- examples/item.refontouml -o path/to/output/folder
``` 
  
## Files description
 
  * CaseStudy and CaseStudy2 - these illustrate the handling of many OntoUML constructs at the same time
  * OverlappingInheritance - handling of multi-level overlapping inheritance
  * Phases - simple exaple of Phases
  * Roles - simple example of Roles
  * Aspects - example of handling aspect types with transitive existential dependency
  * Quantity - example of handling Quantities and *subQuantityOf* relations
  * Collective - example of handling Collectives and *subCollectiveOf* and *memberOf* relations
  * DerivedRelation - example of handling derived material realtions
  * EssentialRelations - example of handling essential realtions
  * Mixin - exmample of handling Mixins
