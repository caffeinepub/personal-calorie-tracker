import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";

module {
  // Types to match old actor structure
  type OldFoodEntry = {
    date : Text;
    foodName : Text;
    calories : Nat;
    image : Storage.ExternalBlob;
  };

  type OldActor = {
    foodEntries : List.List<OldFoodEntry>;
    stepsMap : Map.Map<Text, Nat>;
  };

  type NewFoodEntry = {
    id : Text;
    date : Text;
    foodName : Text;
    calories : Nat;
    image : Storage.ExternalBlob;
  };

  type NewActor = {
    foodEntries : List.List<NewFoodEntry>;
    stepsMap : Map.Map<Text, Nat>;
    calorieLimitsMap : Map.Map<Text, Nat>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newFoodEntries = old.foodEntries.map<OldFoodEntry, NewFoodEntry>(
      func(entry) { { entry with id = entry.foodName } }
    );
    {
      foodEntries = newFoodEntries;
      stepsMap = old.stepsMap;
      calorieLimitsMap = Map.empty<Text, Nat>();
    };
  };
};
